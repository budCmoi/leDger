import { startTransition, useState } from 'react';

import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { Badge } from '../components/common/Badge';
import { formatCurrency, formatDate } from '../lib/utils';
import { bootstrapApi, purchaseInvoiceApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { PurchaseInvoiceRecord } from '../types';

export default function InvoicesPage() {
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [supplier, setSupplier] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Array<{ productId: string; quantity: string; unitPrice: string }>>([{ productId: '', quantity: '1', unitPrice: '0' }]);

  const purchaseInvoices = useAppStore((state) => state.purchaseInvoices);
  const products = useAppStore((state) => state.products);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);

  const refreshWorkspace = async () => {
    startTransition(() => {
      void bootstrapApi.loadRestaurantWorkspace().then((payload) => {
        setRestaurantBootstrap(payload);
      });
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    try {
      await purchaseInvoiceApi.create({
        reference,
        supplier,
        invoiceDate,
        notes: notes || undefined,
        items: items.filter((item) => item.productId).map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      });

      await refreshWorkspace();
      setReference('');
      setSupplier('');
      setNotes('');
      setItems([{ productId: '', quantity: '1', unitPrice: '0' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Factures d entree fournisseur avec lignes de produits et reinjection immediate dans le stock disponible."
          eyebrow="Achats"
          title="Factures d entree"
        />

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            {purchaseInvoices.map((invoice: PurchaseInvoiceRecord) => (
              <Card className="space-y-4" key={invoice.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg uppercase tracking-[0.16em] text-white">{invoice.reference}</h3>
                      <Badge>{invoice.supplier}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      {formatDate(invoice.invoiceDate)} • saisi par {invoice.createdBy.name}
                    </p>
                  </div>
                  <p className="text-lg uppercase tracking-[0.16em] text-white">{formatCurrency(invoice.totalAmount)}</p>
                </div>

                <div className="space-y-2">
                  {invoice.items.map((item) => (
                    <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72" key={item.id}>
                      <span>{item.productName}</span>
                      <span>
                        {item.quantity} • {formatCurrency(item.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-6 space-y-2">
              <p className="premium-label">Saisie</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Nouvelle facture</h2>
              <p className="text-sm text-white/55">Chaque ligne augmente le stock des produits associes.</p>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setReference(event.target.value)} placeholder="Reference" value={reference} />
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setSupplier(event.target.value)} placeholder="Fournisseur" value={supplier} />
              </div>
              <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setInvoiceDate(event.target.value)} type="date" value={invoiceDate} />
              <textarea className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setNotes(event.target.value)} placeholder="Notes" value={notes} />

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div className="grid gap-3 md:grid-cols-[1fr_120px_120px_auto]" key={`${index}-${item.productId}`}>
                    <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setItems((state) => state.map((entry, entryIndex) => entryIndex === index ? { ...entry, productId: event.target.value } : entry))} value={item.productId}>
                      <option value="">Choisir un produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                    <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0.1" onChange={(event) => setItems((state) => state.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: event.target.value } : entry))} step="0.1" type="number" value={item.quantity} />
                    <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0" onChange={(event) => setItems((state) => state.map((entry, entryIndex) => entryIndex === index ? { ...entry, unitPrice: event.target.value } : entry))} step="0.01" type="number" value={item.unitPrice} />
                    <Button onClick={() => setItems((state) => state.length === 1 ? state : state.filter((_, entryIndex) => entryIndex !== index))} type="button" variant="ghost">
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => setItems((state) => [...state, { productId: '', quantity: '1', unitPrice: '0' }])} type="button" variant="secondary">
                  Ajouter une ligne
                </Button>
                <Button disabled={busy} type="submit">
                  Enregistrer la facture
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}