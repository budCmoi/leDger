import { ArrowUpRight } from 'lucide-react';

import { ExpenseDoughnutChart } from '../components/charts/ExpenseDoughnutChart';
import { RevenueLineChart } from '../components/charts/RevenueLineChart';
import { TrendBarChart } from '../components/charts/TrendBarChart';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency, formatDate } from '../lib/utils';
import { useAppStore } from '../store/useAppStore';

export default function DashboardPage() {
  const dashboard = useAppStore((state) => state.dashboard);
  const user = useAppStore((state) => state.user);

  if (!dashboard || !user) {
    return (
      <Card>
        <p className="premium-label">Dashboard</p>
        <p className="mt-4 text-sm text-white/55">Your financial data will appear here once the API session is ready.</p>
      </Card>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          description="Real-time visibility across revenue, costs, margin and recent flow. Designed to feel executive, not operational."
          eyebrow="Command center"
          title={`Welcome back, ${user.name}`}
        />

        <div className="premium-grid md:grid-cols-3">
          <StatCard currency={user.currency} label="Total revenue" tone="positive" value={dashboard.totals.revenue} />
          <StatCard currency={user.currency} label="Expenses" tone="negative" value={dashboard.totals.expenses} />
          <StatCard currency={user.currency} label="Profit" tone="neutral" value={dashboard.totals.profit} />
        </div>

        <div className="premium-grid lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Monthly income</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Revenue pulse</h2>
              </div>
              <Badge>Live</Badge>
            </div>
            <div className="h-80 min-w-0">
              <RevenueLineChart points={dashboard.monthlyIncome} />
            </div>
          </Card>

          <Card className="min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Expense split</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Category mix</h2>
              </div>
              <Badge>12 months</Badge>
            </div>
            <div className="h-80 min-w-0">
              <ExpenseDoughnutChart categories={dashboard.expenseCategories} />
            </div>
          </Card>
        </div>

        <div className="premium-grid lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <div className="mb-6">
              <p className="premium-label">Financial trend</p>
              <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Income versus expenses</h2>
            </div>
            <div className="h-80">
              <TrendBarChart points={dashboard.financialTrends} />
            </div>
          </Card>

          <Card>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="premium-label">Recent transactions</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Activity feed</h2>
              </div>
              <ArrowUpRight className="text-accent" size={18} />
            </div>
            <div className="space-y-3">
              {dashboard.recentTransactions.map((transaction) => (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={transaction.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{transaction.title}</p>
                      <p className="mt-1 text-xs text-white/45">
                        {transaction.category} • {formatDate(transaction.date)}
                      </p>
                    </div>
                    <p className="text-sm uppercase tracking-[0.16em] text-white">
                      {formatCurrency(transaction.amount, transaction.currency)}
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