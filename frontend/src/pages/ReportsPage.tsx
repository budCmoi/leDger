import { useEffect, useState } from 'react';

import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { StatCard } from '../components/common/StatCard';
import { formatCurrency } from '../lib/utils';
import { reportApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(false);

  const user = useAppStore((state) => state.user);
  const monthlyReport = useAppStore((state) => state.monthlyReport);
  const annualReport = useAppStore((state) => state.annualReport);
  const setReports = useAppStore((state) => state.setReports);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const [monthly, annual] = await Promise.all([reportApi.getMonthly(year, month), reportApi.getAnnual(year)]);
        setReports({ monthly, annual });
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, [month, setReports, year]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          action={
            <div className="flex flex-col gap-3 sm:flex-row">
              <input className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setYear(Number(event.target.value))} type="number" value={year} />
              <input className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" max={12} min={1} onChange={(event) => setMonth(Number(event.target.value))} type="number" value={month} />
            </div>
          }
          description="Generate monthly and annual financial reporting, then export CSV for downstream workflows."
          eyebrow="Reporting"
          title="Reports"
        />

        {monthlyReport ? (
          <div className="grid gap-5 md:grid-cols-4">
            <StatCard currency={user?.currency} label="Monthly revenue" tone="positive" value={monthlyReport.revenue} />
            <StatCard currency={user?.currency} label="Monthly expenses" tone="negative" value={monthlyReport.expenses} />
            <StatCard currency={user?.currency} label="Monthly profit" tone="neutral" value={monthlyReport.profit} />
            <StatCard currency={user?.currency} label="Paid invoices" tone="positive" value={monthlyReport.paidInvoiceTotal} />
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="premium-label">Monthly report</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Month {month}, {year}</h2>
              </div>
              <Button disabled={loading} onClick={() => void reportApi.download('monthly', year, month)} variant="secondary">
                Download CSV
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {monthlyReport?.categories.map((category) => (
                <div className="flex items-center justify-between rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4" key={category.label}>
                  <span className="text-sm uppercase tracking-[0.14em] text-white/70">{category.label}</span>
                  <span className="text-sm uppercase tracking-[0.16em] text-white">{formatCurrency(category.value, user?.currency)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="premium-label">Annual report</p>
                <h2 className="mt-2 text-xl uppercase tracking-[0.16em] text-white">Year {year}</h2>
              </div>
              <Button disabled={loading} onClick={() => void reportApi.download('annual', year)} variant="secondary">
                Download CSV
              </Button>
            </div>
            <div className="mt-6 space-y-3">
              {annualReport?.monthlyBreakdown.map((item) => (
                <div className="grid grid-cols-4 gap-3 rounded-[1.5rem] border border-white/8 bg-white/[0.03] px-4 py-4 text-xs uppercase tracking-[0.16em] text-white/65" key={item.month}>
                  <span>Month {item.month}</span>
                  <span>{formatCurrency(item.revenue, user?.currency)}</span>
                  <span>{formatCurrency(item.expenses, user?.currency)}</span>
                  <span>{formatCurrency(item.profit, user?.currency)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}