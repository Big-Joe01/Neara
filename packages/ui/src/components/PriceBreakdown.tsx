import React from 'react';
import type { PaymentBreakdown } from '@neara/types';
import { cn } from '../cn.js';
import { formatNaira } from '../format.js';

export interface PriceBreakdownProps {
  breakdown: PaymentBreakdown;
  className?: string;
  highlightTotal?: boolean;
}

export const PriceBreakdown = ({ breakdown, className, highlightTotal = true }: PriceBreakdownProps) => {
  const rows = breakdown.items.filter((i) => i.amount > 0);
  return (
    <div className={cn('w-full', className)}>
      <h4 className="mb-3 font-display text-sm font-semibold text-charcoal dark:text-textPrimary">Payment breakdown</h4>
      <dl className="space-y-2">
        {rows.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <dt className="text-slateDark dark:text-textSecondary">{item.label}</dt>
            <dd className="font-medium text-charcoal dark:text-textPrimary">{formatNaira(item.amount)}</dd>
          </div>
        ))}
      </dl>
      <div
        className={cn(
          'mt-3 flex items-center justify-between border-t pt-3',
          highlightTotal ? 'border-line dark:border-inkBorder' : 'border-transparent',
        )}
      >
        <span className={cn('font-semibold', highlightTotal ? 'text-brand-forest dark:text-brand-green' : 'text-charcoal dark:text-textPrimary')}>
          Total move-in
        </span>
        <span className={cn('font-display font-bold', highlightTotal ? 'text-brand-forest dark:text-brand-green text-lg' : 'text-charcoal dark:text-textPrimary')}>
          {formatNaira(breakdown.total)}
        </span>
      </div>
    </div>
  );
};
