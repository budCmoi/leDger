import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-paper shadow-[0_18px_50px_rgba(245,198,91,0.25)] hover:bg-[#ffd777] active:translate-y-px',
  secondary: 'bg-white/[0.08] text-ink hover:bg-white/[0.12]',
  ghost: 'bg-transparent text-white/70 hover:bg-white/[0.06] hover:text-white',
  danger: 'bg-accent2/90 text-white hover:bg-accent2',
};

export const Button = ({
  children,
  className,
  fullWidth,
  type = 'button',
  variant = 'primary',
  ...props
}: PropsWithChildren<ButtonProps>) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.18em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variantClassName[variant],
        fullWidth && 'w-full',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};