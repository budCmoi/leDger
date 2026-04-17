import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { TransactionForm, type TransactionFormPayload } from '../components/forms/TransactionForm';
import { formatCurrency, formatDate } from '../lib/utils';
import { dashboardApi, transactionApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '../types';

export default function TransactionsPage() {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Transaction | undefined>(undefined);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const user = useAppStore((state) => state.user);
  const transactions = useAppStore((state) => state.transactions);
  const upsertTransaction = useAppStore((state) => state.upsertTransaction);
  const removeTransaction = useAppStore((state) => state.removeTransaction);
  const setDashboard = useAppStore((state) => state.setDashboard);

  const filteredTransactions = useMemo(() => {
    if (!deferredSearch) {
      return transactions;
    }

    const normalizedSearch = deferredSearch.toLowerCase();
    return transactions.filter((transaction) => {
      return [transaction.title, transaction.category, transaction.counterparty, transaction.notes]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [deferredSearch, transactions]);

  const refreshDashboard = async () => {
    const summary = await dashboardApi.get();
    startTransition(() => {
      setDashboard(summary);
    });
  };

  const handleSubmit = async (payload: TransactionFormPayload) => {
    setBusy(true);
    try {
      const savedTransaction = editing
        ? await transactionApi.update(editing.id, payload)
        : await transactionApi.create(payload);

      startTransition(() => {
        upsertTransaction(savedTransaction);
        setEditing(undefined);
      });
      await refreshDashboard();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!window.confirm('Delete this transaction?')) {
      return;
    }

    await transactionApi.remove(transactionId);
    startTransition(() => {
      removeTransaction(transactionId);
      if (editing?.id === transactionId) {
        setEditing(undefined);
      }
    });
    await refreshDashboard();
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          action={<input className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" onChange={(event) => setSearch(event.target.value)} placeholder="Search transactions" value={search} />}
          description="Track income and expenses with category control, tags, counterparties and polished editing flows."
          eyebrow="Accounting"
          title="Transactions"
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <Card className="space-y-4" key={transaction.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg uppercase tracking-[0.16em] text-white">{transaction.title}</h3>
                      <Badge>{transaction.type}</Badge>
                      <Badge>{transaction.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      {transaction.category} • {transaction.counterparty ?? 'No counterparty'} • {formatDate(transaction.date)}
                    </p>
                  </div>
                  <p className="text-lg uppercase tracking-[0.16em] text-white">{formatCurrency(transaction.amount, transaction.currency)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {transaction.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setEditing(transaction)} variant="secondary">
                    <Pencil size={15} />
                    Edit
                  </Button>
                  <Button onClick={() => void handleDelete(transaction.id)} variant="ghost">
                    <Trash2 size={15} />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-6 space-y-2">
              <p className="premium-label">Editor</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">{editing ? 'Update entry' : 'New transaction'}</h2>
              <p className="text-sm text-white/55">Transactions are validated with Zod on the client and sanitized on the API.</p>
            </div>
            <TransactionForm
              busy={busy}
              initialValues={editing}
              key={editing?.id ?? 'transaction-create'}
              onCancel={editing ? () => setEditing(undefined) : undefined}
              onSubmit={handleSubmit}
            />
            {user ? <p className="mt-4 text-xs uppercase tracking-[0.2em] text-white/35">Base currency {user.currency}</p> : null}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}