export const ACCESS_TOKEN_COOKIE = 'ledger_access_token';
export const CSRF_TOKEN_COOKIE = 'ledger_csrf_token';
export const DEFAULT_CURRENCY = 'USD';
export const DAILY_REVENUE_CAP_REFERENCE = 3000;

export const USER_ROLES = ['user', 'admin'] as const;
export const PRODUCT_CATEGORIES = ['fresh', 'frozen', 'dry'] as const;
export const OUTPUT_TYPES = ['breakfast', 'lunch', 'pizza'] as const;
export const OUTPUT_TYPE_CODES = {
  breakfast: 16,
  lunch: 10,
  pizza: 13,
} as const;
export const STOCK_MOVEMENT_TYPES = ['purchase', 'consumption', 'adjustment'] as const;
export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const TRANSACTION_CATEGORIES = [
  'Sales',
  'Consulting',
  'Subscription',
  'Salary',
  'Food',
  'Rent',
  'SaaS',
  'Travel',
  'Marketing',
  'Operations',
  'Taxes',
  'Equipment',
  'Other',
] as const;

export const INVOICE_STATUSES = ['draft', 'unpaid', 'paid', 'overdue'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type OutputType = (typeof OUTPUT_TYPES)[number];
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];