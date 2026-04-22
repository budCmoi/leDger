import { create } from 'zustand';

import type {
  AdminOverview,
  AnnualReport,
  AuditLogRecord,
  DashboardSummary,
  DailyJournal,
  Invoice,
  InventoryProduct,
  MonthlyReport,
  OutputRecord,
  PurchaseInvoiceRecord,
  RestaurantBootstrap,
  RestaurantDashboard,
  Transaction,
  User,
} from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AppState {
  authStatus: AuthStatus;
  bootstrapped: boolean;
  csrfToken: string | null;
  user: User | null;
  dashboard: DashboardSummary | null;
  restaurantDashboard: RestaurantDashboard | null;
  transactions: Transaction[];
  invoices: Invoice[];
  products: InventoryProduct[];
  purchaseInvoices: PurchaseInvoiceRecord[];
  outputs: OutputRecord[];
  journal: DailyJournal | null;
  auditLogs: AuditLogRecord[];
  monthlyReport: MonthlyReport | null;
  annualReport: AnnualReport | null;
  adminOverview: AdminOverview | null;
  adminUsers: User[];
  adminTransactions: Transaction[];
  setRestaurantBootstrap: (payload: RestaurantBootstrap) => void;
  setAuthSession: (payload: { user: User; csrfToken: string | null }) => void;
  setUnauthenticated: () => void;
  setDashboard: (dashboard: DashboardSummary | null) => void;
  setRestaurantDashboard: (dashboard: RestaurantDashboard | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
  upsertTransaction: (transaction: Transaction) => void;
  removeTransaction: (transactionId: string) => void;
  setInvoices: (invoices: Invoice[]) => void;
  upsertInvoice: (invoice: Invoice) => void;
  removeInvoice: (invoiceId: string) => void;
  setProducts: (products: InventoryProduct[]) => void;
  setPurchaseInvoices: (purchaseInvoices: PurchaseInvoiceRecord[]) => void;
  setOutputs: (outputs: OutputRecord[]) => void;
  setJournal: (journal: DailyJournal | null) => void;
  setAuditLogs: (auditLogs: AuditLogRecord[]) => void;
  setAdminUsers: (users: User[]) => void;
  setReports: (payload: { monthly?: MonthlyReport | null; annual?: AnnualReport | null }) => void;
  setAdminData: (payload: { overview?: AdminOverview | null; users?: User[]; transactions?: Transaction[] }) => void;
  clearSession: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  authStatus: 'loading',
  bootstrapped: false,
  csrfToken: null,
  user: null,
  dashboard: null,
  restaurantDashboard: null,
  transactions: [],
  invoices: [],
  products: [],
  purchaseInvoices: [],
  outputs: [],
  journal: null,
  auditLogs: [],
  monthlyReport: null,
  annualReport: null,
  adminOverview: null,
  adminUsers: [],
  adminTransactions: [],
  setRestaurantBootstrap: (payload) =>
    set({
      authStatus: 'authenticated',
      bootstrapped: true,
      user: payload.session.user,
      csrfToken: payload.session.csrfToken,
      restaurantDashboard: payload.dashboard,
      products: payload.products,
      purchaseInvoices: payload.purchaseInvoices,
      outputs: payload.outputs,
      journal: payload.journal,
      auditLogs: payload.auditLogs,
      adminUsers: payload.users,
    }),
  setAuthSession: ({ user, csrfToken }) =>
    set({
      authStatus: 'authenticated',
      bootstrapped: true,
      user,
      csrfToken,
    }),
  setUnauthenticated: () =>
    set({
      authStatus: 'unauthenticated',
      bootstrapped: true,
      user: null,
      csrfToken: null,
      dashboard: null,
      restaurantDashboard: null,
      transactions: [],
      invoices: [],
      products: [],
      purchaseInvoices: [],
      outputs: [],
      journal: null,
      auditLogs: [],
      monthlyReport: null,
      annualReport: null,
      adminOverview: null,
      adminUsers: [],
      adminTransactions: [],
    }),
  setDashboard: (dashboard) => set({ dashboard }),
  setRestaurantDashboard: (restaurantDashboard) => set({ restaurantDashboard }),
  setTransactions: (transactions) => set({ transactions }),
  upsertTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions.filter((item) => item.id !== transaction.id)],
    })),
  removeTransaction: (transactionId) =>
    set((state) => ({
      transactions: state.transactions.filter((item) => item.id !== transactionId),
    })),
  setInvoices: (invoices) => set({ invoices }),
  upsertInvoice: (invoice) =>
    set((state) => ({
      invoices: [invoice, ...state.invoices.filter((item) => item.id !== invoice.id)],
    })),
  removeInvoice: (invoiceId) =>
    set((state) => ({
      invoices: state.invoices.filter((item) => item.id !== invoiceId),
    })),
  setProducts: (products) => set({ products }),
  setPurchaseInvoices: (purchaseInvoices) => set({ purchaseInvoices }),
  setOutputs: (outputs) => set({ outputs }),
  setJournal: (journal) => set({ journal }),
  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAdminUsers: (adminUsers) => set({ adminUsers }),
  setReports: ({ monthly, annual }) =>
    set((state) => ({
      monthlyReport: monthly === undefined ? state.monthlyReport : monthly,
      annualReport: annual === undefined ? state.annualReport : annual,
    })),
  setAdminData: ({ overview, users, transactions }) =>
    set((state) => ({
      adminOverview: overview === undefined ? state.adminOverview : overview,
      adminUsers: users ?? state.adminUsers,
      adminTransactions: transactions ?? state.adminTransactions,
    })),
  clearSession: () =>
    set({
      authStatus: 'unauthenticated',
      user: null,
      csrfToken: null,
      dashboard: null,
      restaurantDashboard: null,
      transactions: [],
      invoices: [],
      products: [],
      purchaseInvoices: [],
      outputs: [],
      journal: null,
      auditLogs: [],
      monthlyReport: null,
      annualReport: null,
      adminOverview: null,
      adminUsers: [],
      adminTransactions: [],
    }),
}));