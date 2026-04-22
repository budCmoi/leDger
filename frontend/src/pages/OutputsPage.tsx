import { startTransition, useState } from 'react';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { formatCurrency, formatDate } from '../lib/utils';
import { bootstrapApi, outputApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { OutputRecord } from '../types';

type OutputItemForm = {
  productId: string;
  quantity: string;
};

export default function OutputsPage() {
  const outputs = useAppStore((state) => state.outputs);
  const products = useAppStore((state) => state.products);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);
  const [busy, setBusy] = useState(false);
  const [type, setType] = useState<OutputRecord['type']>('breakfast');
  const [notes, setNotes] = useState('');
  const [estimatedRevenue, setEstimatedRevenue] = useState('');
  const [items, setItems] = useState<OutputItemForm[]>([{ productId: '', quantity: '1' }]);

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
      await outputApi.create({
        type,
        notes: notes || undefined,
        estimatedRevenue: estimatedRevenue ? Number(estimatedRevenue) : undefined,
        items: items.filter((item) => item.productId).map((item) => ({
          productId: item.productId,
          quantity: Number(item.quantity),
        })),
      });

      await refreshWorkspace();
      setNotes('');
      setEstimatedRevenue('');
      setItems([{ productId: '', quantity: '1' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Enregistrer les sorties petit-dejeuner, dejeuner et pizza avec impact direct sur le stock et le journal journalier."
          eyebrow="Production"
          title="Sorties de service"
        />

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card>
            <div className="mb-6 space-y-2">
              <p className="premium-label">Nouvelle sortie</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Pointer une consommation</h2>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="grid gap-4 md:grid-cols-2">
                <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setType(event.target.value as OutputRecord['type'])} value={type}>
                  <option value="breakfast">Petit-dejeuner</option>
                  <option value="lunch">Dejeuner</option>
                  <option value="pizza">Pizza</option>
                </select>
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0" onChange={(event) => setEstimatedRevenue(event.target.value)} placeholder="Recette estimee (optionnel)" step="0.01" type="number" value={estimatedRevenue} />
              </div>

              <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setNotes(event.target.value)} placeholder="Notes de service" value={notes} />

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div className="grid gap-3 md:grid-cols-[1fr_140px_auto]" key={`${index}-${item.productId}`}>
                    <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setItems((state) => state.map((entry, entryIndex) => entryIndex === index ? { ...entry, productId: event.target.value } : entry))} value={item.productId}>
                      <option value="">Choisir un produit</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} • {product.currentStock} {product.unit}
                        </option>
                      ))}
                    </select>
                    <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0.1" onChange={(event) => setItems((state) => state.map((entry, entryIndex) => entryIndex === index ? { ...entry, quantity: event.target.value } : entry))} step="0.1" type="number" value={item.quantity} />
                    <Button onClick={() => setItems((state) => state.length === 1 ? state : state.filter((_, entryIndex) => entryIndex !== index))} type="button" variant="ghost">
                      Retirer
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setItems((state) => [...state, { productId: '', quantity: '1' }])} type="button" variant="secondary">
                  Ajouter une ligne
                </Button>
                <Button disabled={busy} type="submit">
                  Enregistrer la sortie
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            {outputs.map((output) => (
              <Card className="space-y-4" key={output.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg uppercase tracking-[0.16em] text-white">{output.type}</h3>
                      <Badge>Code {output.typeCode}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-white/50">
                      {formatDate(output.createdAt)} • {output.createdBy.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm uppercase tracking-[0.18em] text-white">{formatCurrency(output.totalCost)}</p>
                    <p className="mt-1 text-xs text-white/45">Recette {formatCurrency(output.estimatedRevenue)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {output.items.map((item) => (
                    <div className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72" key={item.id}>
                      <span>{item.productName}</span>
                      <span>
                        {item.quantity} • reste {item.remainingStock}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}