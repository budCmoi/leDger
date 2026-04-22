import { useEffect, useState } from 'react';

import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { PageTransition } from '../components/common/PageTransition';
import { SectionHeading } from '../components/common/SectionHeading';
import { formatCurrency, formatDate } from '../lib/utils';
import { journalApi } from '../services/api';
import { useAppStore } from '../store/useAppStore';

export default function JournalPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const journal = useAppStore((state) => state.journal);
  const setJournal = useAppStore((state) => state.setJournal);

  useEffect(() => {
    const loadJournal = async () => {
      setLoading(true);

      try {
        setJournal(await journalApi.getDaily(selectedDate));
      } finally {
        setLoading(false);
      }
    };

    void loadJournal();
  }, [selectedDate, setJournal]);

  return (
    <PageTransition>
      <div className="space-y-8">
        <SectionHeading
          action={<input className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none" onChange={(event) => setSelectedDate(event.target.value)} type="date" value={selectedDate} />}
          description="Lecture journaliere des sorties par type, marges estimees et sequence d execution par service."
          eyebrow="Journal"
          title="Journal quotidien"
        />

        {journal ? (
          <div className="grid gap-5 md:grid-cols-4">
            <Card>
              <p className="premium-label">Sorties</p>
              <p className="mt-5 text-4xl tracking-[0.12em] text-white">{journal.totals.outputsCount}</p>
            </Card>
            <Card>
              <p className="premium-label">Cout total</p>
              <p className="mt-5 text-4xl tracking-[0.12em] text-white">{formatCurrency(journal.totals.totalCost)}</p>
            </Card>
            <Card>
              <p className="premium-label">Recette estimee</p>
              <p className="mt-5 text-4xl tracking-[0.12em] text-white">{formatCurrency(journal.totals.estimatedRevenue)}</p>
            </Card>
            <Card>
              <p className="premium-label">Marge estimee</p>
              <p className="mt-5 text-4xl tracking-[0.12em] text-white">{formatCurrency(journal.totals.estimatedGain)}</p>
            </Card>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card>
            <div className="space-y-2">
              <p className="premium-label">Synthese par type</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">{loading ? 'Chargement...' : `Jour ${journal?.date ?? selectedDate}`}</h2>
            </div>
            <div className="mt-6 space-y-3">
              {journal?.groupedByType.map((group) => (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={group.type}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm uppercase tracking-[0.16em] text-white">{group.type}</p>
                        <Badge>Code {group.typeCode}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-white/45">{group.count} sorties enregistrees</p>
                    </div>
                    <div className="text-right text-xs uppercase tracking-[0.16em] text-white/65">
                      <p>{formatCurrency(group.totalCost)}</p>
                      <p className="mt-1 text-white">{formatCurrency(group.estimatedRevenue)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="space-y-2">
              <p className="premium-label">Trace du jour</p>
              <h2 className="text-xl uppercase tracking-[0.16em] text-white">Chronologie des sorties</h2>
            </div>
            <div className="mt-6 space-y-3">
              {journal?.entries.map((entry) => (
                <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4" key={entry.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.16em] text-white">{entry.type}</p>
                      <p className="mt-1 text-xs text-white/45">{formatDate(entry.createdAt, 'dd MMM yyyy HH:mm')} • {entry.createdBy.name}</p>
                    </div>
                    <Button type="button" variant="ghost">
                      {formatCurrency(entry.totalCost)}
                    </Button>
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