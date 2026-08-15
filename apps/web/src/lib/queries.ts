import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Property, Paginated, PropertyType, Favorite } from '@neara/types';
import { api } from './api';

export interface PropertySearchParams {
  q?: string;
  city?: string;
  area?: string;
  propertyTypeId?: string;
  minRent?: number;
  maxRent?: number;
  rentalPeriod?: string;
  bedrooms?: number;
  bathrooms?: number;
  electricity?: string;
  water?: string;
  listingSource?: string;
  verified?: boolean;
  sort?: string;
  page?: number;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
}

/** Map frontend-friendly params to the actual API search params. */
function toApiParams(p: PropertySearchParams): Record<string, string | number | boolean | undefined> {
  const sortMap: Record<string, string> = {
    newest: 'newest',
    price_low: 'lowest_price',
    price_high: 'highest_price',
    most_viewed: 'most_viewed',
    most_saved: 'most_saved',
    closest: 'closest',
  };
  return {
    query: p.q,
    city: p.city,
    area: p.area,
    propertyTypeIds: p.propertyTypeId,
    minRent: p.minRent,
    maxRent: p.maxRent,
    rentalPeriod: p.rentalPeriod,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    electricity: p.electricity,
    water: p.water,
    listingSource: p.listingSource,
    nearaVerified: p.verified,
    sort: p.sort ? (sortMap[p.sort] ?? 'newest') : 'newest',
    page: p.page ?? 1,
    pageSize: p.limit ?? 12,
    latitude: p.lat,
    longitude: p.lng,
    radiusKm: p.radius,
  };
}

export function useProperties(params: PropertySearchParams) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => api.get<Paginated<Property>>('/properties', toApiParams(params)),
    placeholderData: (prev) => prev,
  });
}

export function useProperty(slugOrId: string) {
  return useQuery({
    queryKey: ['property', slugOrId],
    queryFn: () => api.get<Property>(`/properties/slug/${slugOrId}`),
    enabled: !!slugOrId,
  });
}

export function usePropertyTypes() {
  return useQuery({
    queryKey: ['property-types'],
    queryFn: () => api.get<PropertyType[]>('/lookups/property-types'),
    staleTime: 1000 * 60 * 30,
  });
}

export function useFeaturedProperties() {
  return useQuery({
    queryKey: ['properties', 'featured'],
    queryFn: () => api.get<Paginated<Property>>('/properties', { sort: 'newest', pageSize: 8 }),
    staleTime: 1000 * 60 * 2,
  });
}

export interface FavoriteItem {
  favorite: Favorite;
  property: Property;
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => api.post<Favorite>(`/favorites/${propertyId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['properties'] });
      void qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get<FavoriteItem[]>('/favorites'),
  });
}

export interface Application {
  id: string;
  propertyId: string;
  customerId: string;
  moveInDate: string;
  requestedPeriod: string;
  employment?: string | null;
  income?: number | null;
  status: string;
  createdAt: string;
}

export function useApplications() {
  return useQuery({
    queryKey: ['applications'],
    queryFn: () => api.get<Application[]>('/applications'),
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      propertyId: string;
      moveInDate: string;
      requestedPeriod: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
      employment?: string;
      income?: number;
    }) => api.post<Application>('/applications', input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['applications'] });
    },
  });
}

export interface PaymentBreakdownItem {
  label: string;
  amount: number;
}

export interface PaymentBreakdown {
  rent: number;
  agentFee: number;
  legalFee: number;
  cautionFee: number;
  serviceCharge: number;
  otherFees: number;
  otherFeesLabel?: string;
  total: number;
  items: PaymentBreakdownItem[];
}

export interface PaymentInit {
  payment: { id: string; reference: string; status: string; amount: number; currency: string };
  breakdown: PaymentBreakdown;
  feeCalculation?: { maxFee: number; appliedFee: number; withinLimit: boolean; ruleName?: string };
  authorizationUrl?: string | null;
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (input: {
      propertyId: string;
      applicationId?: string;
      provider?: 'paystack' | 'bank_transfer' | 'ussd' | 'other';
    }) => api.post<PaymentInit>('/payments/init', input),
  });
}

export interface BreakdownPreview {
  breakdown: PaymentBreakdown;
  feeCalculation?: { maxFee: number; appliedFee: number; withinLimit: boolean; ruleName?: string };
}

export function useBreakdownPreview(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['payment-breakdown', propertyId],
    queryFn: () => api.get<BreakdownPreview>(`/payments/breakdown/${propertyId}`),
    enabled: !!propertyId,
  });
}

export function useVerifyPayment(reference: string, enabled = true) {
  return useQuery({
    queryKey: ['payment-verify', reference],
    queryFn: () => api.get<{ payment: { id: string; status: string; amount: number }; settled: boolean }>(`/payments/verify/${reference}`),
    enabled: !!reference && enabled,
    retry: 2,
  });
}
