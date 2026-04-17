export type UserRole = 'user' | 'admin';
export type TransactionType = 'income' | 'expense';
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  companyName: string;
  role: UserRole;
  currency: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  currency: string;
  category: string;
  tags: string[];
  counterparty?: string;
  date: string;
  notes?: string;
  status: 'pending' | 'cleared';
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  paidAt?: string;
}

export interface MetricPoint {
  month: string;
  value: number;
}

export interface TrendPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface DashboardSummary {
  totals: {
    revenue: number;
    expenses: number;
    profit: number;
  };
  monthlyIncome: MetricPoint[];
  expenseCategories: Array<{ label: string; value: number }>;
  financialTrends: TrendPoint[];
  recentTransactions: Transaction[];
}

export interface MonthlyReport {
  scope: 'monthly';
  year: number;
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
  paidInvoiceTotal: number;
  categories: Array<{ label: string; value: number }>;
  transactions: Transaction[];
}

export interface AnnualReport {
  scope: 'annual';
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
  categories: Array<{ label: string; value: number }>;
  monthlyBreakdown: Array<{ month: number; revenue: number; expenses: number; profit: number }>;
  transactions: Transaction[];
}

export interface AdminOverview {
  stats: {
    users: number;
    transactions: number;
    invoices: number;
    revenue: number;
    expenses: number;
    profit: number;
  };
  userRoles: Record<string, number>;
  recentTransactions: Transaction[];
}

export interface SessionResponse {
  user: User;
  csrfToken: string | null;
}

export interface AppBootstrap {
  session: SessionResponse;
  dashboard: DashboardSummary;
  transactions: Transaction[];
  invoices: Invoice[];
}