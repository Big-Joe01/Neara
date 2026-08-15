import React from 'react';
import { cn } from '../cn.js';

export const Spinner = ({ className, size = 20 }: { className?: string; size?: number }) => (
  <svg
    className={cn('animate-spin text-brand-green', className)}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Loading"
    role="status"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
  </svg>
);

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState = ({ label = 'Loading…', className }: LoadingStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-slate', className)} role="status">
    <Spinner size={28} />
    <p className="text-sm">{label}</p>
  </div>
);

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState = ({ title, description, icon, action, className }: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
    {icon && <div className="text-slate">{icon}</div>}
    <h3 className="font-display text-lg font-semibold text-charcoal dark:text-textPrimary">{title}</h3>
    {description && <p className="max-w-sm text-sm text-slate">{description}</p>}
    {action}
  </div>
);

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState = ({ title = 'Something went wrong', message, onRetry, className }: ErrorStateProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)} role="alert">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dangerBg text-danger dark:bg-danger/15">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      </svg>
    </div>
    <h3 className="font-display text-lg font-semibold text-charcoal dark:text-textPrimary">{title}</h3>
    {message && <p className="max-w-sm text-sm text-slate">{message}</p>}
    {onRetry && (
      <button onClick={onRetry} className="mt-1 text-sm font-medium text-brand-green hover:underline">
        Try again
      </button>
    )}
  </div>
);
