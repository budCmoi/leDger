import axios, { AxiosError } from 'axios';

import type {
  AdminOverview,
  AnnualReport,
  DashboardSummary,
  Invoice,
  MonthlyReport,
  SessionResponse,
  Transaction,
  User,
} from '../types';
import { downloadBlob, readCookie } from '../lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && !['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = readCookie('ledger_csrf_token');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }

  return config;
});

export const isUnauthorizedError = (error: unknown) =>
  error instanceof AxiosError && error.response?.status === 401;

export const authApi = {
  startGoogleLogin: () => {
    window.location.assign(`${API_BASE_URL}/auth/google`);
  },
  getSession: async () => {
    const { data } = await apiClient.get<SessionResponse>('/auth/session');
    return data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};

export const dashboardApi = {
  get: async () => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard');
    return data;
  },
};

export const profileApi = {
  update: async (payload: Partial<User>) => {
    const { data } = await apiClient.patch<{ user: User }>('/users/me', payload);
    return data.user;
  },
  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.post<{ user: User }>('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data.user;
  },
};

export const transactionApi = {
  list: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get<{ transactions: Transaction[] }>('/transactions', { params });
    return data.transactions;
  },
  create: async (payload: Omit<Transaction, 'id'>) => {
    const { data } = await apiClient.post<{ transaction: Transaction }>('/transactions', payload);
    return data.transaction;
  },
  update: async (transactionId: string, payload: Partial<Omit<Transaction, 'id'>>) => {
    const { data } = await apiClient.patch<{ transaction: Transaction }>(`/transactions/${transactionId}`, payload);
    return data.transaction;
  },
  remove: async (transactionId: string) => {
    await apiClient.delete(`/transactions/${transactionId}`);
  },
};

export const invoiceApi = {
  list: async (params?: Record<string, string>) => {
    const { data } = await apiClient.get<{ invoices: Invoice[] }>('/invoices', { params });
    return data.invoices;
  },
  create: async (payload: Omit<Invoice, 'id'>) => {
    const { data } = await apiClient.post<{ invoice: Invoice }>('/invoices', payload);
    return data.invoice;
  },
  update: async (invoiceId: string, payload: Partial<Omit<Invoice, 'id'>>) => {
    const { data } = await apiClient.patch<{ invoice: Invoice }>(`/invoices/${invoiceId}`, payload);
    return data.invoice;
  },
  updateStatus: async (invoiceId: string, status: Invoice['status']) => {
    const { data } = await apiClient.patch<{ invoice: Invoice }>(`/invoices/${invoiceId}/status`, { status });
    return data.invoice;
  },
  remove: async (invoiceId: string) => {
    await apiClient.delete(`/invoices/${invoiceId}`);
  },
};

export const reportApi = {
  getMonthly: async (year: number, month: number) => {
    const { data } = await apiClient.get<MonthlyReport>('/reports/monthly', { params: { year, month } });
    return data;
  },
  getAnnual: async (year: number) => {
    const { data } = await apiClient.get<AnnualReport>('/reports/annual', { params: { year } });
    return data;
  },
  download: async (scope: 'monthly' | 'annual', year: number, month?: number) => {
    const { data } = await apiClient.get<Blob>('/reports/download', {
      params: { scope, year, month, format: 'csv' },
      responseType: 'blob',
    });

    downloadBlob(data, `ledger-${scope}-${year}${month ? `-${month}` : ''}.csv`);
  },
};

export const adminApi = {
  getOverview: async () => {
    const { data } = await apiClient.get<AdminOverview>('/admin-secret/overview');
    return data;
  },
  listUsers: async () => {
    const { data } = await apiClient.get<{ users: User[] }>('/admin-secret/users');
    return data.users;
  },
  listTransactions: async () => {
    const { data } = await apiClient.get<{ transactions: Transaction[] }>('/admin-secret/transactions');
    return data.transactions;
  },
  deleteUser: async (userId: string) => {
    await apiClient.delete(`/admin-secret/users/${userId}`);
  },
};