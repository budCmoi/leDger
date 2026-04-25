import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeading = ({ action, className, description, eyebrow, title }: SectionHeadingProps) => {
  return (
    <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between', className)}>
      <div className="space-y-3">
        {eyebrow ? <p className="premium-label">{eyebrow}</p> : null}
        <div className="space-y-2">
          <h1 className="text-sm uppercase tracking-[0.12em] text-white md:text-base">{title}</h1>
          {description ? <p className="max-w-2xl text-xs leading-5 text-white/58">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex items-center gap-3">{action}</div> : null}
    </div>
  );
};