import type { IInvoice } from '../models/Invoice';
import type { ITransaction } from '../models/Transaction';
import { Invoice } from '../models/Invoice';
import { Transaction } from '../models/Transaction';

const toCsvLine = (values: Array<string | number>) =>
  values
    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
    .join(',');

const buildDateRange = (year: number, month?: number) => {
  const startDate = new Date(year, month ? month - 1 : 0, 1);
  const endDate = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);

  return { startDate, endDate };
};

type ReportTransaction = Pick<ITransaction, 'type' | 'amount' | 'category' | 'title' | 'counterparty' | 'date'>;

const summarizeTransactions = (transactions: ReportTransaction[]) => {
  const categories = new Map<string, number>();
  let revenue = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    if (transaction.type === 'income') {
      revenue += transaction.amount;
    } else {
      expenses += transaction.amount;
      categories.set(transaction.category, (categories.get(transaction.category) ?? 0) + transaction.amount);
    }
  }

  return {
    revenue,
    expenses,
    profit: revenue - expenses,
    categories: Array.from(categories.entries()).map(([label, value]) => ({ label, value })),
  };
};

export const buildMonthlyReport = async (userId: string, year: number, month: number) => {
  const { startDate, endDate } = buildDateRange(year, month);
  const transactions = await Transaction.find({
    user: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  }).lean<ITransaction[]>();
  const paidInvoices = await Invoice.find({
    user: userId,
    issueDate: {
      $gte: startDate,
      $lt: endDate,
    },
    status: 'paid',
  }).lean<IInvoice[]>();
  const summary = summarizeTransactions(transactions);

  return {
    scope: 'monthly' as const,
    year,
    month,
    ...summary,
    paidInvoiceTotal: paidInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
    transactions,
  };
};

export const buildAnnualReport = async (userId: string, year: number) => {
  const { startDate, endDate } = buildDateRange(year);
  const transactions = await Transaction.find({
    user: userId,
    date: {
      $gte: startDate,
      $lt: endDate,
    },
  }).lean<ITransaction[]>();
  const summary = summarizeTransactions(transactions);

  const monthlyBreakdown = Array.from({ length: 12 }, (_, index) => {
    const monthTransactions = transactions.filter((transaction) => new Date(transaction.date).getMonth() === index);
    const monthSummary = summarizeTransactions(monthTransactions);

    return {
      month: index + 1,
      revenue: monthSummary.revenue,
      expenses: monthSummary.expenses,
      profit: monthSummary.profit,
    };
  });

  return {
    scope: 'annual' as const,
    year,
    ...summary,
    monthlyBreakdown,
    transactions,
  };
};

export const serializeReportToCsv = (report: Awaited<ReturnType<typeof buildMonthlyReport>> | Awaited<ReturnType<typeof buildAnnualReport>>) => {
  const header = toCsvLine(['Scope', 'Date', 'Type', 'Title', 'Category', 'Amount', 'Counterparty']);
  const lines = report.transactions.map((transaction) =>
    toCsvLine([
      report.scope,
      new Date(transaction.date).toISOString().slice(0, 10),
      transaction.type,
      transaction.title,
      transaction.category,
      transaction.amount,
      transaction.counterparty ?? '',
    ]),
  );

  return [header, ...lines].join('\n');
};