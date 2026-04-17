import { Schema, Types, model } from 'mongoose';

import { DEFAULT_CURRENCY, INVOICE_STATUSES, type InvoiceStatus } from '../constants/app';

export interface IInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IInvoice {
  user: Types.ObjectId;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  companyName: string;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  status: InvoiceStatus;
  items: IInvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  pdfUrl?: string;
  paidAt?: Date;
}

const invoiceItemSchema = new Schema<IInvoiceItem>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  },
);

const invoiceSchema = new Schema<IInvoice>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      trim: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'unpaid',
    },
    items: {
      type: [invoiceItemSchema],
      required: true,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    pdfUrl: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

invoiceSchema.index({ user: 1, invoiceNumber: 1 }, { unique: true });

invoiceSchema.pre('validate', function computeInvoiceTotals(next) {
  this.items = this.items.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }));

  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal + this.tax;
  next();
});

export const Invoice = model<IInvoice>('Invoice', invoiceSchema);