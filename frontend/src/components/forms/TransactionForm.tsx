import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../common/Button';
import { cn } from '../../lib/utils';
import type { Transaction } from '../../types';

const transactionCategories = ['Sales', 'Consulting', 'Subscription', 'Food', 'Rent', 'SaaS', 'Travel', 'Marketing', 'Taxes', 'Other'];
const transactionTypes = ['income', 'expense'] as const;

const transactionFormSchema = z.object({
  type: z.enum(transactionTypes),
  title: z.string().min(2),
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(5),
  category: z.string().min(2),
  tags: z.string().default(''),
  counterparty: z.string().optional(),
  date: z.string().min(1),
  notes: z.string().optional(),
  status: z.enum(['pending', 'cleared']),
});

export type TransactionFormPayload = Omit<Transaction, 'id'>;

interface TransactionFormProps {
  busy?: boolean;
  initialValues?: Transaction;
  onCancel?: () => void;
  onSubmit: (payload: TransactionFormPayload) => Promise<void> | void;
}

const inputClassName =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-accent/60';

export const TransactionForm = ({ busy, initialValues, onCancel, onSubmit }: TransactionFormProps) => {
  const form = useForm({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      type: initialValues?.type ?? 'income',
      title: initialValues?.title ?? '',
      amount: initialValues?.amount ?? 0,
      currency: initialValues?.currency ?? 'USD',
      category: initialValues?.category ?? transactionCategories[0],
      tags: initialValues?.tags?.join(', ') ?? '',
      counterparty: initialValues?.counterparty ?? '',
      date: initialValues?.date ? new Date(initialValues.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      notes: initialValues?.notes ?? '',
      status: initialValues?.status ?? 'cleared',
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      ...values,
      tags: values.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      date: new Date(values.date).toISOString(),
    });

    if (!initialValues) {
      form.reset({
        type: 'income',
        title: '',
        amount: 0,
        currency: 'USD',
        category: transactionCategories[0],
        tags: '',
        counterparty: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
        status: 'cleared',
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange}>
              <div className="relative">
                <ListboxButton className={cn(inputClassName, 'flex items-center justify-between uppercase tracking-[0.18em]')}>
                  {field.value}
                  <ChevronDown size={16} />
                </ListboxButton>
                <ListboxOptions anchor="bottom start" className="premium-panel z-20 mt-2 w-[var(--button-width)] p-2 outline-none">
                  {transactionTypes.map((type) => (
                    <ListboxOption key={type} className="cursor-pointer rounded-xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-white/70 data-[focus]:bg-white/[0.06] data-[focus]:text-white" value={type}>
                      {type}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          )}
        />

        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <Listbox value={field.value} onChange={field.onChange}>
              <div className="relative">
                <ListboxButton className={cn(inputClassName, 'flex items-center justify-between uppercase tracking-[0.18em]')}>
                  {field.value}
                  <ChevronDown size={16} />
                </ListboxButton>
                <ListboxOptions anchor="bottom start" className="premium-panel z-20 mt-2 w-[var(--button-width)] max-h-72 overflow-auto p-2 outline-none">
                  {transactionCategories.map((category) => (
                    <ListboxOption key={category} className="cursor-pointer rounded-xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-white/70 data-[focus]:bg-white/[0.06] data-[focus]:text-white" value={category}>
                      {category}
                    </ListboxOption>
                  ))}
                </ListboxOptions>
              </div>
            </Listbox>
          )}
        />
      </div>

      <input className={inputClassName} placeholder="Transaction title" {...form.register('title')} />

      <div className="grid gap-4 md:grid-cols-3">
        <input className={inputClassName} placeholder="Amount" step="0.01" type="number" {...form.register('amount')} />
        <input className={inputClassName} placeholder="Currency" {...form.register('currency')} />
        <input className={inputClassName} type="date" {...form.register('date')} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <input className={inputClassName} placeholder="Client or vendor" {...form.register('counterparty')} />
        <input className={inputClassName} placeholder="Tags separated by commas" {...form.register('tags')} />
      </div>

      <Controller
        control={form.control}
        name="status"
        render={({ field }) => (
          <Listbox value={field.value} onChange={field.onChange}>
            <div className="relative">
              <ListboxButton className={cn(inputClassName, 'flex items-center justify-between uppercase tracking-[0.18em]')}>
                {field.value}
                <ChevronDown size={16} />
              </ListboxButton>
              <ListboxOptions anchor="bottom start" className="premium-panel z-20 mt-2 w-[var(--button-width)] p-2 outline-none">
                {['cleared', 'pending'].map((status) => (
                  <ListboxOption key={status} className="cursor-pointer rounded-xl px-4 py-3 text-sm uppercase tracking-[0.18em] text-white/70 data-[focus]:bg-white/[0.06] data-[focus]:text-white" value={status}>
                    {status}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </div>
          </Listbox>
        )}
      />

      <textarea className={cn(inputClassName, 'min-h-[120px] resize-none')} placeholder="Notes" {...form.register('notes')} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button className="sm:flex-1" disabled={busy} type="submit">
          {initialValues ? 'Update transaction' : 'Add transaction'}
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