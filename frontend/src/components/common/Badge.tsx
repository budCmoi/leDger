import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/utils';

export const Badge = ({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLSpanElement>>) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/60',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};