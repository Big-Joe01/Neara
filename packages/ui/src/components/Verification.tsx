import React from 'react';
import { cn } from '../cn.js';

type Level = 'none' | 'identity' | 'landlord' | 'property' | 'authorized' | 'neara';

const config: Record<Level, { label: string; className: string; icon: React.ReactNode }> = {
  none: { label: '', className: '', icon: null },
  identity: {
    label: 'Identity Verified',
    className: 'bg-infoBg text-info dark:bg-info/15 dark:text-info',
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  landlord: {
    label: 'Landlord Verified',
    className: 'bg-brand-greenSoft text-brand-forest dark:bg-brand-green/15 dark:text-brand-green',
    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 22V12h6v10" />,
  },
  property: {
    label: 'Property Verified',
    className: 'bg-successBg text-success dark:bg-success/15 dark:text-success',
    icon: <path d="M20 6 9 17l-5-5" />,
  },
  authorized: {
    label: 'Authorized Agent',
    className: 'bg-warningBg text-warning dark:bg-warning/15 dark:text-warning',
    icon: <path d="M12 2 2 7v5c0 5 3.5 9 10 10 6.5-1 10-5 10-10V7Z" />,
  },
  neara: {
    label: 'NEARA Verified',
    className: 'bg-successBg text-success dark:bg-success/15 dark:text-success',
    icon: <path d="M20 6 9 17l-5-5" />,
  },
};

export interface VerificationBadgeProps {
  level: Level;
  label?: string;
  className?: string;
}

export const VerificationBadge = ({ level, label, className }: VerificationBadgeProps) => {
  const c = config[level];
  if (!c.label) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        c.className,
        className,
      )}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
        {c.icon}
      </svg>
      {label ?? c.label}
    </span>
  );
};

export interface AgentBadgeProps {
  listingSource: 'direct' | 'agent';
  className?: string;
}

export const AgentBadge = ({ listingSource, className }: AgentBadgeProps) => {
  const isDirect = listingSource === 'direct';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        isDirect
          ? 'bg-brand-greenSoft text-brand-forest dark:bg-brand-green/15 dark:text-brand-green'
          : 'bg-warningBg text-warning dark:bg-warning/15 dark:text-warning',
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', isDirect ? 'bg-brand-green' : 'bg-warning')} />
      {isDirect ? 'Direct from landlord' : 'Authorized NEARA agent'}
    </span>
  );
};

export interface RatingProps {
  value: number;
  count?: number;
  size?: number;
  className?: string;
  showValue?: boolean;
}

export const Rating = ({ value, count, size = 14, className, showValue }: RatingProps) => (
  <span className={cn('inline-flex items-center gap-1', className)}>
    <div className="flex" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          className={n <= Math.round(value) ? 'text-warning' : 'text-line dark:text-inkBorder'}
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2l3 6.5 7 .9-5 4.8 1.2 7L12 17.8 5.8 21.2 7 14.2 2 9.4l7-.9Z" />
        </svg>
      ))}
    </div>
    {showValue && <span className="text-xs font-medium text-charcoal dark:text-textPrimary">{value.toFixed(1)}</span>}
    {count !== undefined && <span className="text-xs text-slate">({count})</span>}
  </span>
);
