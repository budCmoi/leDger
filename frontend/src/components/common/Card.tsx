import type { HTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/utils';

export const Card = ({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) => {
  return (
    <div className={cn('premium-panel p-5 md:p-6', className)} {...props}>
      {children}
    </div>
  );
};