import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useProperty, useToggleFavorite } from '../lib/queries';
import { useAuth } from '../lib/auth';
import {
  Button, Badge, Card, LoadingState, ErrorState, EmptyState,
  VerificationBadge, AgentBadge, Rating, formatNaira, formatPrice,
  electricityLabel, waterLabel, Modal,
} from '@neara/ui';
import { api } from '../lib/api';
import type { PropertyFees, PropertyUtilities, PropertyFeatures } from '@neara/types';

export function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, isLoading, error } = useProperty(slug ?? '');
  const { user } = useAuth();
  const fav = useToggleFavorite();
  const [activeImg, setActiveImg] = useState(0);
  const [showInspect, setShowInspect] = useState(false);

  if (isLoading) return <LoadingState className="py-20" />;
  if (error) return <ErrorState message="We couldn't load this property." className="py-20" />;
  if (!property) return <EmptyState title="Property not found" className="py-20" />;

  const images = [property.media.coverImage, ...property.media.images.map((i) => i.url)].filter(Boolean);
  const current = images[activeImg] ?? images[0];
  const isFav = property.isFavorited;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-slate">
        <Link to="/" className="hover:text-brand-green">Home</Link>
        <span>/</span>
        <Link to="/search" className="hover:text-brand-green">Search</Link>
        <span>/</span>
        <span className="text-charcoal dark:text-textPrimary">{property.title}</span>
      </nav>

      {/* Gallery */}
      <div className="grid gap-3 lg:grid-cols-[1fr_120px]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-mist dark:bg-inkPanel">
          {current && <img src={current} alt={property.title} className="h-full w-full object-cover" />}
          {property.media.videoUrl && (
            <a href={property.media.videoUrl} target="_blank" rel="noopener" className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white backdrop-blur">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M8 5v14l11-7z" /></svg>
              Watch video
            </a>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-md border-2 ${i === activeImg ? 'border-brand-green' : 'border-transparent'}`}
            >
              <img src={img} alt={`View ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {property.verification.nearaVerified && <VerificationBadge level="neara" />}
              <AgentBadge listingSource={property.listingSource} />
              {property.verification.propertyVerified && <VerificationBadge level="property" />}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-charcoal dark:text-textPrimary sm:text-3xl">{property.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-slate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              {property.location.address}, {property.location.area}, {property.location.city}
            </p>
            {property.ratingCount > 0 && (
              <div className="mt-2">
                <Rating value={property.ratingAverage} count={property.ratingCount} showValue />
              </div>
            )}
          </div>

          {/* Key specs */}
          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Spec label="Type" value={property.propertyType?.name ?? '—'} />
              <Spec label="Bedrooms" value={String(property.features.bedrooms)} />
              <Spec label="Bathrooms" value={String(property.features.bathrooms)} />
              <Spec label="Parking" value={String(property.features.parking)} />
            </div>
          </Card>

          {/* Description */}
          <Card>
            <h2 className="mb-2 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">About this home</h2>
            <p className="text-sm leading-relaxed text-slateDark dark:text-textSecondary">{property.description}</p>
          </Card>

          {/* Utilities */}
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Utilities</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <UtilRow icon="⚡" label="Electricity" value={electricityLabel(property.utilities.electricity)} />
              <UtilRow icon="💧" label="Water" value={waterLabel(property.utilities.water)} />
              <UtilRow icon="🔌" label="Prepaid meter" value={property.utilities.prepaidMeter ? 'Yes' : 'No'} />
              <UtilRow icon="🌐" label="Internet" value={property.utilities.internet ? 'Available' : 'Not available'} />
              <UtilRow icon="⚙️" label="Generator" value={property.utilities.generator ? 'Available' : 'No'} />
              <UtilRow icon="🚰" label="Water source" value={property.utilities.waterSource} />
            </div>
          </Card>

          {/* Features & amenities */}
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Features</h2>
            <div className="flex flex-wrap gap-2">
              {featureList(property.features).map((f) => (
                <Badge key={f} variant="default">{f}</Badge>
              ))}
              {property.amenities.map((a) => (
                <Badge key={a.id} variant="brand">{a.name}</Badge>
              ))}
            </div>
          </Card>

          {/* Location / map */}
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Location</h2>
            <div className="relative h-64 overflow-hidden rounded-md bg-mist dark:bg-inkPanel">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#94C31522 1px, transparent 1px), linear-gradient(90deg, #94C31522 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#1FB864" stroke="white" strokeWidth="2" aria-hidden><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" fill="white" /></svg>
              </div>
            </div>
            <p className="mt-2 text-sm text-slateDark dark:text-textSecondary">{property.location.address}, {property.location.area}, {property.location.city}, {property.location.state}</p>
            {property.location.landmark && <p className="text-xs text-slate">Near: {property.location.landmark}</p>}
          </Card>

          {/* Landlord / agent */}
          <Card>
            <h2 className="mb-3 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">
              {property.listingSource === 'direct' ? 'Landlord' : 'Authorized agent'}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-greenSoft text-brand-forest dark:bg-brand-green/15">
                <span className="font-semibold">
                  {(property.listingSource === 'direct' ? property.landlord.displayName : property.agent?.displayName ?? 'A')?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-charcoal dark:text-textPrimary">
                  {property.listingSource === 'direct' ? property.landlord.displayName : property.agent?.displayName ?? 'Agent'}
                </p>
                {property.listingSource === 'agent' && property.agent && (
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="warning">Authorized NEARA agent</Badge>
                    {property.agent.isVerified && <VerificationBadge level="authorized" />}
                  </div>
                )}
                {property.listingSource === 'direct' && property.landlord.isVerified && (
                  <div className="mt-1"><VerificationBadge level="landlord" /></div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar / sticky CTA */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="space-y-4">
            <div>
              <p className="font-display text-3xl font-bold text-brand-forest dark:text-brand-green">
                {formatPrice(property.fees.rent, property.rentalPeriod)}
              </p>
              <p className="text-sm text-slate">Total move-in: <span className="font-semibold text-charcoal dark:text-textPrimary">{formatNaira(property.fees.totalMoveIn)}</span></p>
            </div>

            <FeeBreakdown fees={property.fees} />

            <div className="space-y-2 border-t border-line pt-4 dark:border-inkBorder">
              <Button fullWidth size="lg" onClick={() => setShowInspect(true)}>
                Request inspection
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => fav.mutate(property.id)}>
                  {isFav ? '♥ Saved' : '♡ Save'}
                </Button>
                <a href={`/properties/${property.slug}/apply`} className="inline-flex h-9 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-charcoal transition-colors hover:bg-mist dark:border-inkBorder dark:text-textPrimary dark:hover:bg-inkPanel">
                  Apply
                </a>
              </div>
              <a href={`/properties/${property.slug}/pay`} className="inline-flex h-9 w-full items-center justify-center rounded-md text-sm font-medium text-brand-green hover:underline">
                Continue to payment →
              </a>
            </div>

            <p className="text-center text-xs text-slate">
              {user ? 'You can message the landlord after requesting inspection.' : <Link to="/login" className="text-brand-green hover:underline">Sign in</Link>} to continue.
            </p>
          </Card>
        </div>
      </div>

      <InspectionModal open={showInspect} onClose={() => setShowInspect(false)} propertyId={property.id} />
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate">{label}</p>
      <p className="font-medium text-charcoal dark:text-textPrimary">{value}</p>
    </div>
  );
}

function UtilRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span>{icon}</span>
      <div>
        <p className="text-xs text-slate">{label}</p>
        <p className="text-sm font-medium capitalize text-charcoal dark:text-textPrimary">{value}</p>
      </div>
    </div>
  );
}

function FeeBreakdown({ fees }: { fees: PropertyFees }) {
  const rows = [
    { label: 'Rent', amount: fees.rent },
    { label: 'Agent fee', amount: fees.agentFee },
    { label: 'Legal fee', amount: fees.legalFee },
    { label: 'Caution fee', amount: fees.cautionFee },
    { label: 'Service charge', amount: fees.serviceCharge },
    ...(fees.otherFees > 0 ? [{ label: fees.otherFeesLabel ?? 'Other fees', amount: fees.otherFees }] : []),
  ].filter((r) => r.amount > 0);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-slateDark dark:text-textSecondary">Transparent breakdown</p>
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-sm">
          <span className="text-slate">{r.label}</span>
          <span className="font-medium text-charcoal dark:text-textPrimary">{formatNaira(r.amount)}</span>
        </div>
      ))}
    </div>
  );
}

function featureList(f: PropertyFeatures): string[] {
  const out: string[] = [];
  if (f.kitchen) out.push('Kitchen');
  if (f.furnished) out.push('Furnished');
  if (f.airConditioning) out.push('A/C');
  if (f.balcony) out.push('Balcony');
  if (f.wardrobe) out.push('Wardrobe');
  if (f.fenced) out.push('Fenced');
  if (f.security) out.push('Security');
  if (f.securityGate) out.push('Security gate');
  if (f.compound) out.push('Compound');
  return out;
}

function InspectionModal({ open, onClose, propertyId }: { open: boolean; onClose: () => void; propertyId: string }) {
  const { user } = useAuth();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await api.post('/inspections', { propertyId, requestedDate: date, requestedTime: time });
      setDone(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to request inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Modal open={open} onClose={onClose} title="Request inspection">
        <p className="text-sm text-slateDark dark:text-textSecondary">You need an account to request an inspection.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/login"><Button size="sm">Sign in</Button></Link>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Request inspection">
      {done ? (
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-successBg text-success dark:bg-success/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <p className="font-medium text-charcoal dark:text-textPrimary">Inspection requested!</p>
          <p className="mt-1 text-sm text-slate">The landlord/agent will confirm your slot soon.</p>
          <Button className="mt-4" size="sm" onClick={onClose}>Done</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Preferred date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Preferred time</label>
            <input type="time" required value={time} onChange={(e) => setTime(e.target.value)} className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary" />
          </div>
          {err && <p className="text-xs text-danger">{err}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={submitting} size="sm">Request</Button>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
