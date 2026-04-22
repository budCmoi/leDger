export type UserRole = 'user' | 'admin';
export type TransactionType = 'income' | 'expense';
export type InvoiceStatus = 'draft' | 'unpaid' | 'paid' | 'overdue';
export type ProductCategory = 'fresh' | 'frozen' | 'dry';
export type OutputType = 'breakfast' | 'lunch' | 'pizza';

export interface User {
  id: string;
  identifier?: string;
  fullName?: string;
  email: string;
  name: string;
  avatar?: string;
  companyName: string;
  role: UserRole;
  currency: string;
  isActive?: boolean;
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

export interface InventoryProduct {
  id: string;
  name: string;
  unitPrice: number;
  category: ProductCategory;
  isOrganic: boolean;
  unit: string;
  currentStock: number;
  minimumStock: number;
  inventoryValue: number;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseInvoiceLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface PurchaseInvoiceRecord {
  id: string;
  reference: string;
  supplier: string;
  totalAmount: number;
  invoiceDate: string;
  notes?: string | null;
  createdAt: string;
  createdBy: User;
  items: PurchaseInvoiceLine[];
}

export interface OutputLine {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  lineTotal: number;
  remainingStock: number;
}

export interface OutputRecord {
  id: string;
  type: OutputType;
  typeCode: number;
  notes?: string | null;
  estimatedRevenue: number;
  totalCost: number;
  createdAt: string;
  createdBy: User;
  items: OutputLine[];
}

export interface OutputBreakdown {
  type: OutputType;
  typeCode: number;
  count: number;
  totalCost: number;
  estimatedRevenue: number;
  entries?: OutputRecord[];
}

export interface DailyJournal {
  date: string;
  totals: {
    outputsCount: number;
    totalCost: number;
    estimatedRevenue: number;
    estimatedGain: number;
    estimatedLoss: number;
  };
  groupedByType: OutputBreakdown[];
  entries: OutputRecord[];
}

export interface RestaurantDashboard {
  metrics: {
    totalInvoices: number;
    inventoryValue: number;
    totalOutputCost: number;
    estimatedRevenue: number;
    estimatedGain: number;
    estimatedLoss: number;
    dailyRevenueCap: number;
    dailyRevenueUsed: number;
  };
  lowStockProducts: InventoryProduct[];
  recentInvoices: PurchaseInvoiceRecord[];
  recentOutputs: OutputRecord[];
  outputBreakdown: OutputBreakdown[];
  categoryStockValue: Array<{ label: string; value: number }>;
}

export interface AuditLogRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  payload?: unknown;
  createdAt: string;
  actor: User;
}

export interface RestaurantBootstrap {
  session: SessionResponse;
  dashboard: RestaurantDashboard;
  products: InventoryProduct[];
  purchaseInvoices: PurchaseInvoiceRecord[];
  outputs: OutputRecord[];
  journal: DailyJournal;
  auditLogs: AuditLogRecord[];
  users: User[];
}