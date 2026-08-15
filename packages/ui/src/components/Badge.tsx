import React from 'react';
import { cn } from '../cn.js';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'verified';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-mist text-slateDark dark:bg-inkPanel dark:text-textSecondary',
  success: 'bg-successBg text-success dark:bg-success/15 dark:text-success',
  warning: 'bg-warningBg text-warning dark:bg-warning/15 dark:text-warning',
  danger: 'bg-dangerBg text-danger dark:bg-danger/15 dark:text-danger',
  info: 'bg-infoBg text-info dark:bg-info/15 dark:text-info',
  brand: 'bg-brand-greenSoft text-brand-forest dark:bg-brand-green/15 dark:text-brand-green',
  verified: 'bg-successBg text-success dark:bg-success/15 dark:text-success',
};

export const Badge = ({ variant = 'default', icon, className, children, ...rest }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant],
      className,
    )}
    {...rest}
  >
    {icon}
    {children}
  </span>
);
