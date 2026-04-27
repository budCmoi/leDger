import { ArrowUpRight } from 'lucide-react';

import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { StatCard } from '../components/common/StatCard';
import { TrendBarChart } from '../components/charts/TrendBarChart';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export default function DashboardPage() {
  const dashboard = useAppStore((state) => state.restaurantDashboard);
  const journal = useAppStore((state) => state.journal);
  const user = useAppStore((state) => state.user);

  if (!dashboard || !user) {
    return (
      <Card>
        <p className="premium-label">Tableau de bord</p>
        <p className="mt-4 text-sm text-white/55">Les indicateurs restauration apparaitront ici une fois la session chargee.</p>
      </Card>
    );
  }

  const currency = user.currency || 'USD';
  const outputTrend = dashboard.outputBreakdown.map((item) => ({
    month: String(item.typeCode),
    income: item.estimatedRevenue,
    expenses: item.totalCost,
  }));

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Vision immediate sur les achats, la valeur de stock, les sorties du jour et la marge estimee par service."
          eyebrow="Pilotage"
          title={`Bonjour ${user.name}`}
        />

        <div className="premium-grid md:grid-cols-4">
          <StatCard currency={currency} label="Achats" tone="neutral" value={dashboard.metrics.totalInvoices} />
          <StatCard currency={currency} label="Valeur stock" tone="positive" value={dashboard.metrics.inventoryValue} />
          <StatCard currency={currency} label="Cout sorties" tone="negative" value={dashboard.metrics.totalOutputCost} />
          <StatCard currency={currency} label="Recette estimee" tone="positive" value={dashboard.metrics.estimatedRevenue} />
        </div>

        <div className="premium-grid lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Cap quotidien</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Suivi journalier</h2>
              </div>
              <Badge>Aujourd hui</Badge>
            </div>
            <div className="h-80 min-w-0">
              <TrendBarChart points={outputTrend} />
            </div>
          </Card>

          <Card className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Alertes stock</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Produits sensibles</h2>
              </div>
              <Badge>{dashboard.lowStockProducts.length}</Badge>
            </div>
            <div className="space-y-3">
              {dashboard.lowStockProducts.slice(0, 8).map((product) => (
                <div className="flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4" key={product.id}>
                  <span className="text-sm uppercase tracking-[0.16em] text-white/72">{product.name}</span>
                  <span className="text-xs uppercase tracking-[0.16em] text-white/65">
                    {product.currentStock} / {product.minimumStock} {product.unit}
                  </span>
                </div>
              ))}
              {dashboard.lowStockProducts.length === 0 ? (
                <p className="text-sm text-white/55">Aucun produit en-dessous du seuil minimum.</p>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="premium-grid lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-6">
              <p className="premium-label">Repartition</p>
              <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Valeur du stock par categorie</h2>
            </div>
            <div className="space-y-3">
              {dashboard.categoryStockValue.map((item) => (
                <div className="flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4" key={item.label}>
                  <span className="text-sm uppercase tracking-[0.16em] text-white/72">{item.label}</span>
                  <span className="text-sm uppercase tracking-[0.16em] text-white">{formatCurrency(item.value, currency)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Journal du jour</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Sorties recentes</h2>
              </div>
              <ArrowUpRight className="text-accent" size={18} />
            </div>
            <div className="space-y-3">
              {(journal?.entries ?? dashboard.recentOutputs).map((output) => (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={output.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{output.type}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {output.createdBy.name} • {formatDate(output.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm uppercase tracking-[0.16em] text-white">
                      {formatCurrency(output.totalCost, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}