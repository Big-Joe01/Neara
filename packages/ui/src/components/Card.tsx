import React from 'react';
import { cn } from '../cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ padded = true, hoverable, className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-line bg-white shadow-sm dark:border-inkBorder dark:bg-inkSoft',
        padded && 'p-5',
        hoverable && 'transition-shadow hover:shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  ),
);
Card.displayName = 'Card';

export const CardHeader = ({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-4 flex items-center justify-between', className)} {...rest}>
    {children}
  </div>
);

export const CardTitle = ({ className, children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display text-lg font-semibold text-charcoal dark:text-textPrimary', className)} {...rest}>
    {children}
  </h3>
);
