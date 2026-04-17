import { create } from 'zustand';

import type {
  AdminOverview,
  AnnualReport,
  DashboardSummary,
  Invoice,
  MonthlyReport,
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
  transactions: Transaction[];
  invoices: Invoice[];
  monthlyReport: MonthlyReport | null;
  annualReport: AnnualReport | null;
  adminOverview: AdminOverview | null;
  adminUsers: User[];
  adminTransactions: Transaction[];
  setAuthSession: (payload: { user: User; csrfToken: string | null }) => void;
  setUnauthenticated: () => void;
  setDashboard: (dashboard: DashboardSummary | null) => void;
  setTransactions: (transactions: Transaction[]) => void;
  upsertTransaction: (transaction: Transaction) => void;
  removeTransaction: (transactionId: string) => void;
  setInvoices: (invoices: Invoice[]) => void;
  upsertInvoice: (invoice: Invoice) => void;
  removeInvoice: (invoiceId: string) => void;
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
  transactions: [],
  invoices: [],
  monthlyReport: null,
  annualReport: null,
  adminOverview: null,
  adminUsers: [],
  adminTransactions: [],
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
      transactions: [],
      invoices: [],
      monthlyReport: null,
      annualReport: null,
      adminOverview: null,
      adminUsers: [],
      adminTransactions: [],
    }),
  setDashboard: (dashboard) => set({ dashboard }),
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
      transactions: [],
      invoices: [],
      monthlyReport: null,
      annualReport: null,
      adminOverview: null,
      adminUsers: [],
      adminTransactions: [],
    }),
}));