import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedProperties } from '../lib/queries';
import { PropertyCard, Button, LoadingState, EmptyState, VerificationBadge, formatNaira } from '@neara/ui';

const popularAreas = ['Yaba', 'Lekki', 'Ajah', 'Ikeja', 'Surulere', 'Gbagada', 'Magodo', 'Maryland'];

const categories = [
  { label: 'Self Contain', query: 'Self Contain' },
  { label: '1 Bedroom', query: '1 Bedroom' },
  { label: '2 Bedroom', query: '2 Bedroom' },
  { label: 'Mini Flat', query: 'Mini Flat' },
  { label: 'Studio', query: 'Studio' },
  { label: 'Short-let', query: 'Short-let' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const { data, isLoading, error } = useFeaturedProperties();
  const properties = data?.items ?? [];

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-forest via-brand-forest-deep to-ink text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #C9F31E 0, transparent 40%), radial-gradient(circle at 80% 20%, #1FB864 0, transparent 40%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-brand-bright-lime" /> Transparent housing for Lagos
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              Find your next home.<br />
              <span className="text-brand-bright-lime">One tap from home.</span>
            </h1>
            <p className="mt-4 text-lg text-white/80">
              Verified properties. Transparent rent. No hidden agent fees. Search thousands of homes across Lagos — direct from landlords or authorized NEARA agents.
            </p>

            <form onSubmit={onSearch} className="mt-8 flex flex-col gap-3 rounded-xl bg-white p-3 shadow-xl dark:bg-inkSoft sm:flex-row">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search area, landmark, or property name"
                  className="h-12 w-full bg-transparent px-3 text-sm text-charcoal outline-none placeholder:text-slate dark:text-textPrimary"
                  aria-label="Search query"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-12 w-full bg-transparent px-3 text-sm text-charcoal outline-none dark:text-textPrimary"
                  aria-label="City"
                >
                  <option value="">All cities</option>
                  <option value="Lagos">Lagos</option>
                  <option value="Lekki">Lekki</option>
                  <option value="Ikeja">Ikeja</option>
                  <option value="Yaba">Yaba</option>
                </select>
              </div>
              <Button type="submit" size="lg" className="shrink-0">Search homes</Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2">
              {popularAreas.map((area) => (
                <button
                  key={area}
                  onClick={() => navigate(`/search?area=${area}`)}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/90 backdrop-blur transition-colors hover:bg-white/20"
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Browse by type</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.query}
              onClick={() => navigate(`/search?q=${encodeURIComponent(c.query)}`)}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-brand-green hover:text-brand-green dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary"
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Verified homes</h2>
          <a href="/search?verified=true" className="text-sm font-medium text-brand-green hover:underline">View all</a>
        </div>
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <EmptyState title="Couldn't load properties" description="Please try again later." />
        ) : properties.length === 0 ? (
          <EmptyState title="No properties yet" description="Check back soon for verified listings." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {properties.slice(0, 8).map((p) => (
              <a key={p.id} href={`/properties/${p.slug}`} className="block">
                <PropertyCard property={p} />
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Trust strip */}
      <section className="border-y border-line bg-cloud dark:border-inkBorder dark:bg-inkSoft">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <TrustItem
            icon={<path d="M20 6 9 17l-5-5" />}
            title="NEARA Verified"
            desc="Every verified listing is checked for ownership and authorization before it goes live."
          />
          <TrustItem
            icon={<path d="M12 2 2 7v5c0 5 3.5 9 10 10 6.5-1 10-5 10-10V7Z" />}
            title="Regulated agent fees"
            desc="Agents can't charge arbitrary fees. We enforce transparent, admin-configured fee limits."
          />
          <TrustItem
            icon={<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM9 22V12h6v10" />}
            title="Direct from landlord"
            desc="Many listings come directly from verified landlords — no middlemen at all."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="rounded-xl bg-brand-forest p-8 text-center text-white sm:p-12">
          <h2 className="font-display text-2xl font-bold sm:text-3xl">Own property in Lagos?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            List your property directly, reach verified tenants, and keep full control — or authorize a NEARA agent under regulated fees.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href="/register?role=LANDLORD"><Button variant="secondary" size="lg" className="bg-white text-brand-forest hover:bg-cloud">List as landlord</Button></a>
            <a href="/register?role=AGENT"><Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">Join as agent</Button></a>
          </div>
        </div>
      </section>
    </div>
  );
}

function TrustItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-greenSoft text-brand-forest dark:bg-brand-green/15 dark:text-brand-green">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>{icon}</svg>
      </div>
      <h3 className="font-display text-base font-semibold text-charcoal dark:text-textPrimary">{title}</h3>
      <p className="mt-1 text-sm text-slate">{desc}</p>
    </div>
  );
}
