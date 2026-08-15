import type {
  ElectricityReliability,
  RentalPeriod,
  VerificationLevel,
  WaterAvailability,
} from '@neara/types';

export function formatNaira(amount: number): string {
  return '₦' + new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount);
}

export function formatPrice(amount: number, period?: RentalPeriod): string {
  const suffix = period
    ? {
        daily: '/ night',
        weekly: '/ week',
        monthly: '/ month',
        quarterly: '/ quarter',
        yearly: '/ year',
        custom: '',
      }[period]
    : '';
  return `${formatNaira(amount)}${suffix}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function generateReference(prefix = 'NEARA'): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}_${ts}${rand}`;
}

export function generateOtp(): string {
  // 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateAgreementId(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `NEARA-AGR-${year}-${rand}`;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);
  return {
    items: paged,
    total: items.length,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(items.length / pageSize)),
  };
}

/** Haversine distance in km. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function electricityLabel(e: ElectricityReliability): string {
  return {
    excellent: 'Excellent electricity',
    fair: 'Fair electricity',
    poor: 'Poor electricity',
    none: 'No electricity',
  }[e];
}

export function waterLabel(w: WaterAvailability): string {
  return {
    reliable: 'Reliable water',
    intermittent: 'Intermittent water',
    none: 'No water',
  }[w];
}

export function verificationLabel(level: VerificationLevel): string {
  return {
    none: 'Unverified',
    identity: 'Identity Verified',
    landlord: 'Landlord Verified',
    property: 'Property Verified',
    inspection: 'Inspection Verified',
    neara: 'NEARA Verified',
  }[level];
}

export function isExpired(date?: string | null): boolean {
  if (!date) return false;
  return new Date(date).getTime() < Date.now();
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-3);
}

export function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function classNames(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
