export const ACCESS_TOKEN_COOKIE = 'ledger_access_token';
export const CSRF_TOKEN_COOKIE = 'ledger_csrf_token';
export const DEFAULT_CURRENCY = 'USD';

export const USER_ROLES = ['user', 'admin'] as const;
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
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];