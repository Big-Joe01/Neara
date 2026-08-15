import React, { forwardRef } from 'react';
import { cn, type Variant, type Size } from '../cn.js';

type ButtonVariant = Variant;
type ButtonSize = Exclude<Size, 'xl'>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand-green text-white hover:bg-brand-green-dark focus-visible:ring-brand-green/40',
  secondary: 'bg-brand-forest text-white hover:bg-brand-forest-deep focus-visible:ring-brand-forest/40',
  outline: 'border border-line bg-transparent text-charcoal hover:bg-mist dark:text-textPrimary dark:border-inkBorder dark:hover:bg-inkPanel',
  ghost: 'bg-transparent text-charcoal hover:bg-mist dark:text-textPrimary dark:hover:bg-inkPanel',
  danger: 'bg-danger text-white hover:opacity-90 focus-visible:ring-danger/40',
  success: 'bg-success text-white hover:opacity-90 focus-visible:ring-success/40',
  warning: 'bg-warning text-white hover:opacity-90 focus-visible:ring-warning/40',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs gap-1.5',
  sm: 'h-9 px-4 text-sm gap-2',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', fullWidth, loading, leftIcon, rightIcon, className, children, disabled, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 outline-none focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none select-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
        </svg>
      ) : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  ),
);
Button.displayName = 'Button';
