import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties, usePropertyTypes, type PropertySearchParams } from '../lib/queries';
import { PropertyCard, Button, LoadingState, EmptyState, PropertyCardSkeleton } from '@neara/ui';
import type { RentalPeriod } from '@neara/types';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Lowest price' },
  { value: 'price_high', label: 'Highest price' },
  { value: 'most_viewed', label: 'Most viewed' },
  { value: 'most_saved', label: 'Most saved' },
];

const periods: { value: string; label: string }[] = [
  { value: '', label: 'Any period' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<'list' | 'map'>('list');
  const { data: types } = usePropertyTypes();

  const params: PropertySearchParams = useMemo(() => ({
    q: searchParams.get('q') ?? undefined,
    city: searchParams.get('city') ?? undefined,
    area: searchParams.get('area') ?? undefined,
    propertyTypeId: searchParams.get('propertyTypeId') ?? undefined,
    minRent: searchParams.get('minRent') ? Number(searchParams.get('minRent')) : undefined,
    maxRent: searchParams.get('maxRent') ? Number(searchParams.get('maxRent')) : undefined,
    rentalPeriod: searchParams.get('rentalPeriod') ?? undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    listingSource: searchParams.get('listingSource') ?? undefined,
    verified: searchParams.get('verified') === 'true' ? true : undefined,
    sort: searchParams.get('sort') ?? 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    limit: 12,
  }), [searchParams]);

  const { data, isLoading, isFetching } = useProperties(params);
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 12));

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-charcoal dark:text-textPrimary">
          {total > 0 ? `${total} ${total === 1 ? 'home' : 'homes'}` : 'Search homes'}
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={params.sort}
            onChange={(e) => update('sort', e.target.value)}
            className="h-10 rounded-md border border-line bg-white px-3 text-sm dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="flex rounded-md border border-line dark:border-inkBorder">
            <button onClick={() => setView('list')} className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-brand-green text-white' : 'text-slate'}`}>List</button>
            <button onClick={() => setView('map')} className={`px-3 py-2 text-sm ${view === 'map' ? 'bg-brand-green text-white' : 'text-slate'}`}>Map</button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-line bg-white p-4 dark:border-inkBorder dark:bg-inkSoft">
            <h2 className="mb-3 font-display text-sm font-semibold text-charcoal dark:text-textPrimary">Filters</h2>
            <div className="space-y-3">
              <FilterField label="Property type">
                <select value={params.propertyTypeId ?? ''} onChange={(e) => update('propertyTypeId', e.target.value)} className="filter-select">
                  <option value="">Any type</option>
                  {(types ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </FilterField>
              <FilterField label="Rental period">
                <select value={params.rentalPeriod ?? ''} onChange={(e) => update('rentalPeriod', e.target.value as RentalPeriod | '')} className="filter-select">
                  {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </FilterField>
              <FilterField label="Min rent (₦)">
                <input type="number" value={params.minRent ?? ''} onChange={(e) => update('minRent', e.target.value)} placeholder="0" className="filter-input" />
              </FilterField>
              <FilterField label="Max rent (₦)">
                <input type="number" value={params.maxRent ?? ''} onChange={(e) => update('maxRent', e.target.value)} placeholder="Any" className="filter-input" />
              </FilterField>
              <FilterField label="Bedrooms">
                <select value={params.bedrooms ?? ''} onChange={(e) => update('bedrooms', e.target.value)} className="filter-select">
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{`${n}+`}</option>)}
                </select>
              </FilterField>
              <FilterField label="Listing">
                <select value={params.listingSource ?? ''} onChange={(e) => update('listingSource', e.target.value)} className="filter-select">
                  <option value="">All listings</option>
                  <option value="direct">Direct from landlord</option>
                  <option value="agent">Authorized agent</option>
                </select>
              </FilterField>
              <label className="flex items-center gap-2 text-sm text-slateDark dark:text-textSecondary">
                <input type="checkbox" checked={params.verified ?? false} onChange={(e) => update('verified', e.target.checked ? 'true' : '')} className="accent-brand-green" />
                Verified only
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          {view === 'map' ? (
            <div className="overflow-hidden rounded-lg border border-line dark:border-inkBorder">
              <MapView items={items} loading={isLoading} />
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <PropertyCardSkeleton key={i} />)}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No homes found"
              description="Try adjusting your filters or searching a different area."
              action={<Button variant="outline" size="sm" onClick={() => setSearchParams(new URLSearchParams())}>Clear filters</Button>}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <a key={p.id} href={`/properties/${p.slug}`} className={isFetching ? 'opacity-60' : ''}>
                    <PropertyCard property={p} />
                  </a>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={params.page === 1} onClick={() => update('page', String((params.page ?? 1) - 1))}>Previous</Button>
                  <span className="text-sm text-slate">Page {params.page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={(params.page ?? 1) >= totalPages} onClick={() => update('page', String((params.page ?? 1) + 1))}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        .filter-select, .filter-input { @apply h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-charcoal outline-none dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary; }
      `}</style>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate">{label}</label>
      {children}
    </div>
  );
}

function MapView({ items, loading }: { items: import('@neara/types').Property[]; loading: boolean }) {
  // Map abstraction — renders a lightweight placeholder map with pins.
  // Provider (Google Maps / Mapbox / Leaflet) can be swapped via VITE_MAP_PROVIDER_KEY.
  if (loading) return <LoadingState className="py-20" />;
  if (items.length === 0) return <EmptyState title="No properties to map" className="py-20" />;
  return (
    <div className="relative h-[500px] bg-mist dark:bg-inkPanel">
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#94C31522 1px, transparent 1px), linear-gradient(90deg, #94C31522 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {items.slice(0, 20).map((p, i) => {
        const lat = p.location.latitude ?? 6.5;
        const lng = p.location.longitude ?? 3.4;
        const x = ((lng - 3.2) / 0.6) * 100;
        const y = ((6.7 - lat) / 0.4) * 100;
        return (
          <a
            key={p.id}
            href={`/properties/${p.slug}`}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-green px-2 py-1 text-xs font-bold text-white shadow-lg transition-transform hover:scale-110"
            style={{ left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(10, Math.min(90, y))}%`, zIndex: i }}
            title={p.title}
          >
            ₦{(p.fees.rent / 1000).toFixed(0)}k
          </a>
        );
      })}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-4 py-2 text-xs text-slate shadow dark:bg-inkSoft/90">
        Showing {Math.min(20, items.length)} of {items.length} properties on map
      </div>
    </div>
  );
}
