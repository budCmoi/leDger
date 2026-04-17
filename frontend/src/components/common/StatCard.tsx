import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card } from './Card';
import { formatCurrency } from '../../lib/utils';

interface StatCardProps {
  label: string;
  value: number;
  currency?: string;
  tone?: 'positive' | 'negative' | 'neutral';
}

const toneStyles = {
  positive: 'text-accent4',
  negative: 'text-accent2',
  neutral: 'text-accent',
};

export const StatCard = ({ currency, label, tone = 'neutral', value }: StatCardProps) => {
  const isNegative = tone === 'negative';
  const ArrowIcon = isNegative ? ArrowDownRight : ArrowUpRight;

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="space-y-5">
        <p className="premium-label">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-3xl tracking-[0.12em] text-white md:text-4xl">{formatCurrency(value, currency)}</p>
          <span className={toneStyles[tone]}>
            <ArrowIcon size={18} />
          </span>
        </div>
      </div>
    </Card>
  );
};