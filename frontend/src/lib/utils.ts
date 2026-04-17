import jsPDF from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

import type { Invoice } from '../types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string | Date, pattern = 'dd MMM yyyy') =>
  format(typeof value === 'string' ? new Date(value) : value, pattern);

export const readCookie = (name: string) => {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const exportInvoiceToPdf = (invoice: Invoice) => {
  const pdf = new jsPDF();

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(24);
  pdf.text('LEDGER PREMIUM', 20, 24);
  pdf.setFontSize(11);
  pdf.text(`Invoice ${invoice.invoiceNumber}`, 20, 34);
  pdf.text(`Client: ${invoice.clientName}`, 20, 42);
  pdf.text(`Issue Date: ${formatDate(invoice.issueDate)}`, 20, 50);
  pdf.text(`Due Date: ${formatDate(invoice.dueDate)}`, 20, 58);

  let y = 76;
  pdf.setFont('courier', 'bold');
  pdf.text('Description', 20, y);
  pdf.text('Qty', 120, y);
  pdf.text('Price', 145, y);
  pdf.text('Total', 178, y);
  pdf.setFont('courier', 'normal');

  invoice.items.forEach((item) => {
    y += 10;
    pdf.text(item.description, 20, y);
    pdf.text(String(item.quantity), 120, y);
    pdf.text(formatCurrency(item.unitPrice, invoice.currency), 145, y);
    pdf.text(formatCurrency(item.total, invoice.currency), 178, y, { align: 'right' });
  });

  y += 18;
  pdf.setFont('courier', 'bold');
  pdf.text(`Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`, 20, y);
  pdf.text(`Tax: ${formatCurrency(invoice.tax, invoice.currency)}`, 20, y + 8);
  pdf.text(`Total: ${formatCurrency(invoice.total, invoice.currency)}`, 20, y + 16);

  pdf.save(`invoice-${invoice.invoiceNumber}.pdf`);
};