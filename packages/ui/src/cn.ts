import { clsx, type ClassValue } from 'clsx';

export type { ClassValue };
export const cn = (...values: ClassValue[]) => clsx(values);

/** Common variant tuples shared across components. */
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
