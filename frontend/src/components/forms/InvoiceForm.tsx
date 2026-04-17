import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../common/Button';
import { cn, formatCurrency } from '../../lib/utils';
import type { Invoice } from '../../types';

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(2),
  clientName: z.string().min(2),
  clientEmail: z.string().email(),
  companyName: z.string().min(2),
  currency: z.string().min(3).max(5),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(['draft', 'unpaid', 'paid', 'overdue']),
  tax: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      description: z.string().min(2),
      quantity: z.coerce.number().int().min(1),
      unitPrice: z.coerce.number().min(0),
    }),
  ),
});

export type InvoiceFormPayload = Omit<Invoice, 'id'>;

interface InvoiceFormProps {
  busy?: boolean;
  initialValues?: Invoice;
  onCancel?: () => void;
  onSubmit: (payload: InvoiceFormPayload) => Promise<void> | void;
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/60';

export const InvoiceForm = ({ busy, initialValues, onCancel, onSubmit }: InvoiceFormProps) => {
  const form = useForm({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: initialValues?.invoiceNumber ?? `INV-${Date.now().toString().slice(-6)}`,
      clientName: initialValues?.clientName ?? '',
      clientEmail: initialValues?.clientEmail ?? '',
      companyName: initialValues?.companyName ?? '',
      currency: initialValues?.currency ?? 'USD',
      issueDate: initialValues?.issueDate ? new Date(initialValues.issueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      dueDate: initialValues?.dueDate ? new Date(initialValues.dueDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      status: initialValues?.status ?? 'unpaid',
      tax: initialValues?.tax ?? 0,
      notes: initialValues?.notes ?? '',
      items:
        initialValues?.items?.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })) ?? [{ description: '', quantity: 1, unitPrice: 0 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });
  const watchedItems = form.watch('items');
  const watchedTax = form.watch('tax');
  const watchedCurrency = form.watch('currency');

  const subtotal = watchedItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const total = subtotal + Number(watchedTax || 0);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      issueDate: new Date(values.issueDate).toISOString(),
      dueDate: new Date(values.dueDate).toISOString(),
      subtotal,
      total,
      items: values.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      })),
    });
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Invoice number" {...form.register('invoiceNumber')} />
        <select className={cn(inputClassName, 'uppercase tracking-[0.18em]')} {...form.register('status')}>
          {['draft', 'unpaid', 'paid', 'overdue'].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Client name" {...form.register('clientName')} />
        <input className={inputClassName} placeholder="Client email" {...form.register('clientEmail')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Company name" {...form.register('companyName')} />
        <input className={inputClassName} placeholder="Currency" {...form.register('currency')} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <input className={inputClassName} type="date" {...form.register('issueDate')} />
        <input className={inputClassName} type="date" {...form.register('dueDate')} />
        <input className={inputClassName} placeholder="Tax" step="0.01" type="number" {...form.register('tax')} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="premium-label">Line items</p>
          <Button onClick={() => append({ description: '', quantity: 1, unitPrice: 0 })} variant="ghost">
            <Plus size={16} />
            Add row
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,0.75fr)_minmax(0,1fr)_auto]">
            <input className={inputClassName} placeholder="Description" {...form.register(`items.${index}.description`)} />
            <input className={inputClassName} placeholder="Qty" type="number" {...form.register(`items.${index}.quantity`)} />
            <input className={inputClassName} placeholder="Unit price" step="0.01" type="number" {...form.register(`items.${index}.unitPrice`)} />
            <Button className="self-stretch" onClick={() => remove(index)} variant="secondary">
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
      </div>

      <textarea className={cn(inputClassName, 'min-h-[120px] resize-none')} placeholder="Notes" {...form.register('notes')} />

      <div className="premium-panel flex flex-col gap-2 rounded-[1.5rem] p-4 text-sm text-white/65">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, watchedCurrency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Tax</span>
          <span>{formatCurrency(Number(watchedTax || 0), watchedCurrency)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-white">
          <span>Total</span>
          <span>{formatCurrency(total, watchedCurrency)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="sm:flex-1" disabled={busy} type="submit">
          {initialValues ? 'Update invoice' : 'Create invoice'}
        </Button>
        {onCancel ? (
          <Button className="sm:flex-1" onClick={onCancel} variant="secondary">
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
};