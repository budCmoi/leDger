import { startTransition, useState } from 'react';
import { Pencil, RefreshCcw } from 'lucide-react';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { formatCurrency } from '../lib/utils';
import { bootstrapApi, productApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import type { InventoryProduct } from '../types';

type ProductFormState = {
  name: string;
  unitPrice: string;
  category: InventoryProduct['category'];
  isOrganic: boolean;
  unit: string;
  currentStock: string;
  minimumStock: string;
};

const emptyForm: ProductFormState = {
  name: '',
  unitPrice: '0',
  category: 'fresh',
  isOrganic: false,
  unit: 'kg',
  currentStock: '0',
  minimumStock: '0',
};

export default function ProductsPage() {
  const products = useAppStore((state) => state.products);
  const setRestaurantBootstrap = useAppStore((state) => state.setRestaurantBootstrap);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<InventoryProduct | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const refreshWorkspace = async () => {
    startTransition(() => {
      void bootstrapApi.loadRestaurantWorkspace().then((payload) => {
        setRestaurantBootstrap(payload);
      });
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleEdit = (product: InventoryProduct) => {
    setEditing(product);
    setForm({
      name: product.name,
      unitPrice: String(product.unitPrice),
      category: product.category,
      isOrganic: product.isOrganic,
      unit: product.unit,
      currentStock: String(product.currentStock),
      minimumStock: String(product.minimumStock),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    try {
      if (editing) {
        await productApi.update(editing.id, {
          name: form.name,
          unitPrice: Number(form.unitPrice),
          category: form.category,
          isOrganic: form.isOrganic,
          unit: form.unit,
          minimumStock: Number(form.minimumStock),
        });
      } else {
        await productApi.create({
          name: form.name,
          unitPrice: Number(form.unitPrice),
          category: form.category,
          isOrganic: form.isOrganic,
          unit: form.unit,
          currentStock: Number(form.currentStock),
          minimumStock: Number(form.minimumStock),
        });
      }

      await refreshWorkspace();
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  const handleAdjustStock = async (product: InventoryProduct) => {
    const nextStockValue = window.prompt(`Nouveau stock pour ${product.name}`, String(product.currentStock));

    if (nextStockValue === null) {
      return;
    }

    const reason = window.prompt('Motif de l ajustement', 'Inventaire de fin de service');

    if (!reason) {
      return;
    }

    setBusy(true);

    try {
      await productApi.adjustStock(product.id, {
        newStock: Number(nextStockValue),
        reason,
      });
      await refreshWorkspace();
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Catalogue matiere, seuils d alerte et ajustements rapides pour garder un stock juste avant chaque service."
          eyebrow="Stock"
          title="Produits et inventaire"
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {products.map((product) => (
              <Card className="space-y-4" key={product.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg uppercase tracking-[0.16em] text-white">{product.name}</h3>
                      <Badge>{product.category}</Badge>
                      {product.isOrganic ? <Badge>Bio</Badge> : null}
                      {product.isLowStock ? <Badge>Seuil atteint</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-white/55">
                      {product.currentStock} {product.unit} en stock • minimum {product.minimumStock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm uppercase tracking-[0.18em] text-white">{formatCurrency(product.inventoryValue)}</p>
                    <p className="mt-1 text-xs text-white/45">{formatCurrency(product.unitPrice)} / {product.unit}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleEdit(product)} variant="secondary">
                    <Pencil size={15} />
                    Modifier
                  </Button>
                  <Button disabled={busy} onClick={() => void handleAdjustStock(product)} variant="ghost">
                    <RefreshCcw size={15} />
                    Ajuster le stock
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <div className="mb-6 space-y-2">
              <p className="premium-label">Fiche produit</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h2>
            </div>

            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} placeholder="Nom du produit" value={form.name} />
              <div className="grid gap-4 md:grid-cols-2">
                <select className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setForm((state) => ({ ...state, category: event.target.value as InventoryProduct['category'] }))} value={form.category}>
                  <option value="fresh">Frais</option>
                  <option value="frozen">Surgeles</option>
                  <option value="dry">Sec</option>
                </select>
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setForm((state) => ({ ...state, unit: event.target.value }))} placeholder="Unite" value={form.unit} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0" onChange={(event) => setForm((state) => ({ ...state, unitPrice: event.target.value }))} placeholder="Prix unitaire" step="0.01" type="number" value={form.unitPrice} />
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0" onChange={(event) => setForm((state) => ({ ...state, minimumStock: event.target.value }))} placeholder="Seuil minimum" step="0.01" type="number" value={form.minimumStock} />
              </div>
              {!editing ? (
                <input className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" min="0" onChange={(event) => setForm((state) => ({ ...state, currentStock: event.target.value }))} placeholder="Stock initial" step="0.01" type="number" value={form.currentStock} />
              ) : null}
              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                <input checked={form.isOrganic} onChange={(event) => setForm((state) => ({ ...state, isOrganic: event.target.checked }))} type="checkbox" />
                Produit bio
              </label>

              <div className="flex gap-3">
                <Button disabled={busy} type="submit">
                  {editing ? 'Enregistrer' : 'Creer le produit'}
                </Button>
                {editing ? (
                  <Button onClick={resetForm} type="button" variant="ghost">
                    Annuler
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}