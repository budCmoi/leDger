import { Invoice } from '../models/Invoice';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { mapInvoice } from '../utils/serializers';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listInvoices = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const filter: Record<string, unknown> = { user: req.user._id };
  const query = req.query as Record<string, string | undefined>;

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const searchPattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ invoiceNumber: searchPattern }, { clientName: searchPattern }, { clientEmail: searchPattern }];
  }

  const invoices = await Invoice.find(filter).sort({ dueDate: 1 }).lean();
  res.json({ invoices: invoices.map((invoice) => mapInvoice(invoice)) });
});

export const getInvoiceById = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const invoice = await Invoice.findOne({ _id: req.params.invoiceId, user: req.user._id }).lean();

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  res.json({ invoice: mapInvoice(invoice) });
});

export const createInvoice = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const invoice = await Invoice.create({
    ...req.body,
    user: req.user._id,
  });

  res.status(201).json({ invoice: mapInvoice(invoice.toObject()) });
});

export const updateInvoice = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const invoice = await Invoice.findOne({ _id: req.params.invoiceId, user: req.user._id });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  Object.assign(invoice, req.body);
  await invoice.save();

  res.json({ invoice: mapInvoice(invoice.toObject()) });
});

export const updateInvoiceStatus = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const invoice = await Invoice.findOne({ _id: req.params.invoiceId, user: req.user._id });

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  invoice.status = req.body.status;
  invoice.paidAt = req.body.status === 'paid' ? new Date() : undefined;
  await invoice.save();

  res.json({ invoice: mapInvoice(invoice.toObject()) });
});

export const deleteInvoice = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const invoice = await Invoice.findOneAndDelete({ _id: req.params.invoiceId, user: req.user._id }).lean();

  if (!invoice) {
    throw new AppError(404, 'Invoice not found');
  }

  res.status(204).send();
});