import { startTransition, useDeferredValue, useMemo, useState } from 'react';
import { Download, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { InvoiceForm, type InvoiceFormPayload } from '../components/forms/InvoiceForm';
import { exportInvoiceToPdf, formatCurrency, formatDate } from '../lib/utils';
import { invoiceApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { Invoice } from '../types';

export default function InvoicesPage() {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Invoice | undefined>(undefined);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);

  const invoices = useAppStore((state) => state.invoices);
  const upsertInvoice = useAppStore((state) => state.upsertInvoice);
  const removeInvoice = useAppStore((state) => state.removeInvoice);

  const filteredInvoices = useMemo(() => {
    if (!deferredSearch) {
      return invoices;
    }

    const normalizedSearch = deferredSearch.toLowerCase();
    return invoices.filter((invoice) => {
      return [invoice.invoiceNumber, invoice.clientName, invoice.clientEmail, invoice.companyName]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [deferredSearch, invoices]);

  const handleSubmit = async (payload: InvoiceFormPayload) => {
    setBusy(true);
    try {
      const savedInvoice = editing ? await invoiceApi.update(editing.id, payload) : await invoiceApi.create(payload);
      startTransition(() => {
        upsertInvoice(savedInvoice);
        setEditing(undefined);
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    if (!window.confirm('Delete this invoice?')) {
      return;
    }

    await invoiceApi.remove(invoiceId);
    startTransition(() => {
      removeInvoice(invoiceId);
      if (editing?.id === invoiceId) {
        setEditing(undefined);
      }
    });
  };

  const handleTogglePaid = async (invoice: Invoice) => {
    const updatedInvoice = await invoiceApi.updateStatus(invoice.id, invoice.status === 'paid' ? 'unpaid' : 'paid');
    startTransition(() => {
      upsertInvoice(updatedInvoice);
      if (editing?.id === invoice.id) {
        setEditing(updatedInvoice);
      }
    });
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          action={<input className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25" onChange={(event) => setSearch(event.target.value)} placeholder="Search invoices" value={search} />}
          description="Create, revise, export and settle invoices without leaving the premium workspace."
          eyebrow="Billing"
          title="Invoices"
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card className="space-y-4" key={invoice.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg uppercase tracking-[0.16em] text-white">{invoice.invoiceNumber}</h3>
                      <Badge>{invoice.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      {invoice.clientName} • Due {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <p className="text-lg uppercase tracking-[0.16em] text-white">{formatCurrency(invoice.total, invoice.currency)}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setEditing(invoice)} variant="secondary">
                    <Pencil size={15} />
                    Edit
                  </Button>
                  <Button onClick={() => exportInvoiceToPdf(invoice)} variant="ghost">
                    <Download size={15} />
                    Export PDF
                  </Button>
                  <Button onClick={() => void handleTogglePaid(invoice)} variant="ghost">
                    {invoice.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}
                  </Button>
                  <Button onClick={() => void handleDelete(invoice.id)} variant="ghost">
                    <Trash2 size={15} />
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-6 space-y-2">
              <p className="premium-label">Studio</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">{editing ? 'Edit invoice' : 'Create invoice'}</h2>
              <p className="text-sm text-white/55">Line items remain fluid and compact on mobile and desktop.</p>
            </div>
            <InvoiceForm
              busy={busy}
              initialValues={editing}
              key={editing?.id ?? 'invoice-create'}
              onCancel={editing ? () => setEditing(undefined) : undefined}
              onSubmit={handleSubmit}
            />
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}