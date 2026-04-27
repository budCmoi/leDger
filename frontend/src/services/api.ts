import axios, { AxiosError } from 'axios';

import type {
  AdminOverview,
  AnnualReport,
  AuditLogRecord,
  AppBootstrap,
  DashboardSummary,
  DailyJournal,
  Invoice,
  InventoryProduct,
  MonthlyReport,
  OutputRecord,
  ProductListParams,
  ProductListResponse,
  ProductMutationPayload,
  PurchaseInvoiceRecord,
  RestaurantBootstrap,
  SessionResponse,
  Transaction,
  User,
} from '../types';
import { downloadBlob, readCookie } from '../lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:4000/api');
export const SOCKET_BASE_URL = import.meta.env.VITE_SOCKET_URL ?? (import.meta.env.PROD ? undefined : 'http://localhost:4000');

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

const normalizeUser = (user: Partial<User> & Pick<User, 'id' | 'role' | 'name'>) => ({
  id: user.id,
  identifier: user.identifier,
  fullName: user.fullName ?? user.name,
  email: user.email ?? '',
  name: user.name ?? user.fullName ?? '',
  avatar: user.avatar,
  companyName: user.companyName ?? 'Operations restauration',
  role: user.role,
  currency: user.currency ?? 'USD',
  isActive: user.isActive ?? true,
});

const normalizeSession = (session: SessionResponse): SessionResponse => ({
  ...session,
  user: normalizeUser(session.user),
});

const normalizeProduct = (product: Partial<InventoryProduct> & Pick<InventoryProduct, 'id' | 'name' | 'category' | 'unit' | 'minimumStock' | 'createdAt' | 'updatedAt'>): InventoryProduct => {
  const price = product.price ?? product.unitPrice ?? 0;
  const quantity = product.quantity ?? product.currentStock ?? 0;
  const isBio = product.isBio ?? product.isOrganic ?? false;

  return {
    ...product,
    price,
    unitPrice: price,
    isBio,
    isOrganic: isBio,
    type: product.type ?? (isBio ? 'bio' : product.category),
    description: product.description ?? null,
    quantity,
    currentStock: quantity,
    inventoryValue: product.inventoryValue ?? quantity * price,
    isLowStock: product.isLowStock ?? (product.minimumStock > 0 && quantity <= product.minimumStock),
  } as InventoryProduct;
};

const normalizeRestaurantBootstrap = (payload: RestaurantBootstrap): RestaurantBootstrap => ({
  ...payload,
  session: normalizeSession(payload.session),
  dashboard: {
    ...payload.dashboard,
    lowStockProducts: payload.dashboard.lowStockProducts.map((product) => normalizeProduct(product)),
  },
  products: payload.products.map((product) => normalizeProduct(product)),
  purchaseInvoices: payload.purchaseInvoices.map((invoice) => ({
    ...invoice,
    createdBy: normalizeUser(invoice.createdBy),
  })),
  outputs: payload.outputs.map((output) => ({
    ...output,
    createdBy: normalizeUser(output.createdBy),
  })),
  journal: {
    ...payload.journal,
    entries: payload.journal.entries.map((entry) => ({
      ...entry,
      createdBy: normalizeUser(entry.createdBy),
    })),
    groupedByType: payload.journal.groupedByType.map((group) => ({
      ...group,
      entries: group.entries?.map((entry) => ({
        ...entry,
        createdBy: normalizeUser(entry.createdBy),
      })),
    })),
  },
  auditLogs: payload.auditLogs.map((log) => ({
    ...log,
    actor: normalizeUser(log.actor),
  })),
  users: payload.users.map((user) => normalizeUser(user)),
});

export const authApi = {
  createFirebaseSession: async (payload: {
    idToken: string;
    profile?: {
      name?: string;
      companyName?: string;
    };
  }) => {
    const { data } = await apiClient.post<SessionResponse>('/auth/firebase/session', payload);
    return data;
  },
  getSession: async () => {
    const { data } = await apiClient.get<SessionResponse>('/auth/session');
    return normalizeSession(data);
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};

export const bootstrapApi = {
  loadRestaurantWorkspace: async () => {
    const { data } = await apiClient.get<RestaurantBootstrap>('/bootstrap');
    return normalizeRestaurantBootstrap(data);
  },
  loadAuthenticatedApp: async () => {
    const session = await authApi.getSession();
    const [dashboard, transactions, invoices] = await Promise.all([
      dashboardApi.get(),
      transactionApi.list(),
      invoiceApi.list(),
    ]);

    return {
      session,
      dashboard,
      transactions,
      invoices,
    } satisfies AppBootstrap;
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
  listUsers: async () => {
    const { data } = await apiClient.get<{ users: User[] }>('/admin/users');
    return data.users.map((user) => normalizeUser(user));
  },
  createUser: async (payload: { identifier: string; fullName: string; password: string; role: User['role'] }) => {
    const { data } = await apiClient.post<{ user: User }>('/admin/users', payload);
    return normalizeUser(data.user);
  },
  listAuditLogs: async () => {
    const { data } = await apiClient.get<{ auditLogs: AuditLogRecord[] }>('/admin/audit-logs');
    return data.auditLogs.map((log) => ({
      ...log,
      actor: normalizeUser(log.actor),
    }));
  },
};

export const productApi = {
  list: async (params: ProductListParams = {}) => {
    const { data } = await apiClient.get<ProductListResponse>('/products', { params });
    return {
      ...data,
      items: data.items.map((product) => normalizeProduct(product)),
    } satisfies ProductListResponse;
  },
  create: async (payload: ProductMutationPayload) => {
    const { data } = await apiClient.post<{ product: InventoryProduct }>('/products', payload);
    return normalizeProduct(data.product);
  },
  update: async (productId: string, payload: Partial<ProductMutationPayload>) => {
    const { data } = await apiClient.patch<{ product: InventoryProduct }>(`/products/${productId}`, payload);
    return normalizeProduct(data.product);
  },
  remove: async (productId: string) => {
    await apiClient.delete(`/products/${productId}`);
  },
  adjustStock: async (productId: string, payload: { newStock: number; reason: string }) => {
    const { data } = await apiClient.post<{ product: InventoryProduct }>(`/products/${productId}/stock-adjustments`, payload);
    return normalizeProduct(data.product);
  },
};

export const purchaseInvoiceApi = {
  list: async () => {
    const { data } = await apiClient.get<{ purchaseInvoices: PurchaseInvoiceRecord[] }>('/purchase-invoices');
    return data.purchaseInvoices;
  },
  create: async (payload: {
    reference: string;
    supplier: string;
    invoiceDate: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }) => {
    const { data } = await apiClient.post<{ purchaseInvoice: PurchaseInvoiceRecord }>('/purchase-invoices', payload);
    return data.purchaseInvoice;
  },
};

export const outputApi = {
  list: async () => {
    const { data } = await apiClient.get<{ outputs: OutputRecord[] }>('/outputs');
    return data.outputs;
  },
  create: async (payload: {
    type: OutputRecord['type'];
    notes?: string;
    estimatedRevenue?: number;
    items: Array<{ productId: string; quantity: number }>;
  }) => {
    const { data } = await apiClient.post<{ output: OutputRecord }>('/outputs', payload);
    return data.output;
  },
};

export const journalApi = {
  getDaily: async (date?: string) => {
    const { data } = await apiClient.get<{ journal: DailyJournal }>('/journal/daily', {
      params: date ? { date } : undefined,
    });
    return data.journal;
  },
};