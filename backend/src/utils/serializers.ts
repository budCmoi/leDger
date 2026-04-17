type Identifiable = {
  _id?: unknown;
  id?: string;
};

const resolveId = (value: Identifiable) => value.id ?? String(value._id);

export const mapUser = (user: unknown) => {
  const source = user as Identifiable & Record<string, unknown>;

  return {
    id: resolveId(source),
    email: String(source.email ?? ''),
    name: String(source.name ?? ''),
    avatar: source.avatar ? String(source.avatar) : undefined,
    companyName: String(source.companyName ?? ''),
    role: String(source.role ?? 'user'),
    currency: String(source.currency ?? 'USD'),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

export const mapTransaction = (transaction: unknown) => {
  const source = transaction as Identifiable & Record<string, unknown>;

  return {
    id: resolveId(source),
    type: String(source.type ?? ''),
    title: String(source.title ?? ''),
    amount: Number(source.amount ?? 0),
    currency: String(source.currency ?? 'USD'),
    category: String(source.category ?? ''),
    tags: Array.isArray(source.tags) ? source.tags.map(String) : [],
    counterparty: source.counterparty ? String(source.counterparty) : undefined,
    date: source.date,
    notes: source.notes ? String(source.notes) : undefined,
    status: String(source.status ?? 'cleared'),
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};

export const mapInvoice = (invoice: unknown) => {
  const source = invoice as Identifiable & Record<string, unknown>;

  return {
    id: resolveId(source),
    invoiceNumber: String(source.invoiceNumber ?? ''),
    clientName: String(source.clientName ?? ''),
    clientEmail: String(source.clientEmail ?? ''),
    companyName: String(source.companyName ?? ''),
    currency: String(source.currency ?? 'USD'),
    issueDate: source.issueDate,
    dueDate: source.dueDate,
    status: String(source.status ?? 'unpaid'),
    items: Array.isArray(source.items)
      ? source.items.map((item) => ({
        description: String((item as Record<string, unknown>).description ?? ''),
        quantity: Number((item as Record<string, unknown>).quantity ?? 0),
        unitPrice: Number((item as Record<string, unknown>).unitPrice ?? 0),
        total: Number((item as Record<string, unknown>).total ?? 0),
      }))
      : [],
    subtotal: Number(source.subtotal ?? 0),
    tax: Number(source.tax ?? 0),
    total: Number(source.total ?? 0),
    notes: source.notes ? String(source.notes) : undefined,
    pdfUrl: source.pdfUrl ? String(source.pdfUrl) : undefined,
    paidAt: source.paidAt,
    createdAt: source.createdAt,
    updatedAt: source.updatedAt,
  };
};