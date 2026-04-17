import { Transaction } from '../models/Transaction';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

const emptyMonthlyBuckets = () =>
  Array.from({ length: 12 }, (_, index) => ({
    month: monthFormatter.format(new Date(2026, index, 1)),
    income: 0,
    expenses: 0,
  }));

export const buildDashboardSummary = async (userId: string) => {
  const transactions = await Transaction.find({ user: userId }).sort({ date: -1 }).lean();
  const monthlyBuckets = emptyMonthlyBuckets();
  const expenseCategories = new Map<string, number>();

  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const transaction of transactions) {
    const monthIndex = new Date(transaction.date).getMonth();
    const monthBucket = monthlyBuckets[monthIndex];

    if (transaction.type === 'income') {
      totalRevenue += transaction.amount;
      monthBucket.income += transaction.amount;
    } else {
      totalExpenses += transaction.amount;
      monthBucket.expenses += transaction.amount;
      expenseCategories.set(
        transaction.category,
        (expenseCategories.get(transaction.category) ?? 0) + transaction.amount,
      );
    }
  }

  return {
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      profit: totalRevenue - totalExpenses,
    },
    monthlyIncome: monthlyBuckets.map((bucket) => ({
      month: bucket.month,
      value: bucket.income,
    })),
    expenseCategories: Array.from(expenseCategories.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    financialTrends: monthlyBuckets,
    recentTransactions: transactions.slice(0, 6),
  };
};