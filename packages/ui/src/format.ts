import type { RentalPeriod } from '@neara/types';

/** Format Naira amounts with the ₦ symbol and locale grouping. */
export function formatNaira(amount: number, opts?: { compact?: boolean }): string {
  if (opts?.compact && amount >= 1_000_000) {
    return `₦${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  }
  if (opts?.compact && amount >= 1_000) {
    return `₦${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}k`;
  }
  return `₦${amount.toLocaleString('en-NG')}`;
}

const periodSuffix: Record<RentalPeriod, string> = {
  daily: '/ night',
  weekly: '/ week',
  monthly: '/ month',
  quarterly: '/ quarter',
  yearly: '/ year',
  custom: '',
};

export function formatPrice(rent: number, period: RentalPeriod, compact?: boolean): string {
  return `${formatNaira(rent, { compact })}${periodSuffix[period]}`;
}

const electricityLabels: Record<string, string> = {
  excellent: 'Excellent electricity',
  good: 'Good electricity',
  fair: 'Fair electricity',
  poor: 'Poor electricity',
  none: 'No electricity',
};

const waterLabels: Record<string, string> = {
  reliable: 'Reliable water',
  intermittent: 'Intermittent water',
  none: 'No water',
};

export function electricityLabel(value: string): string {
  return electricityLabels[value] ?? value;
}

export function waterLabel(value: string): string {
  return waterLabels[value] ?? value;
}
