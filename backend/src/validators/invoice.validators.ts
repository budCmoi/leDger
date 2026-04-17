import { z } from 'zod';

import { INVOICE_STATUSES } from '../constants/app';

const invoiceItemSchema = z.object({
  description: z.string().min(2).max(160),
  quantity: z.coerce.number().int().min(1),
  unitPrice: z.coerce.number().min(0),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(2).max(40),
  clientName: z.string().min(2).max(120),
  clientEmail: z.string().email(),
  companyName: z.string().min(2).max(120),
  currency: z.string().min(3).max(5).default('USD'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  status: z.enum(INVOICE_STATUSES).default('unpaid'),
  items: z.array(invoiceItemSchema).min(1).max(12),
  tax: z.coerce.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});

export const invoiceQuerySchema = z.object({
  status: z.enum(INVOICE_STATUSES).optional(),
  search: z.string().optional(),
});