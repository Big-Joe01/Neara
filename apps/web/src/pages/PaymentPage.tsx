import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Button, Badge, PriceBreakdown } from '@neara/ui';
import { useProperty, useInitiatePayment, useBreakdownPreview } from '../lib/queries';
import { ApiError } from '../lib/auth';

const PROVIDERS = [
  { value: 'paystack', label: 'Card (Paystack)' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'ussd', label: 'USSD' },
] as const;

export function PaymentPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const applicationId = params.get('applicationId') ?? undefined;
  const { data: property, isLoading } = useProperty(slug ?? '');
  const { data: preview } = useBreakdownPreview(property?.id);
  const initPayment = useInitiatePayment();

  const [provider, setProvider] = useState<'paystack' | 'bank_transfer' | 'ussd' | 'other'>('paystack');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onPay = async () => {
    setError('');
    if (!property) return;
    setLoading(true);
    try {
      const res = await initPayment.mutateAsync({ propertyId: property.id, applicationId, provider });
      if (res.authorizationUrl) {
        window.location.href = res.authorizationUrl;
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment initialization failed');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <div className="mx-auto max-w-2xl px-4 py-12 text-slate">Loading…</div>;
  if (!property) return <div className="mx-auto max-w-2xl px-4 py-12 text-slate">Property not found.</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate">
        <Link to={`/properties/${slug}`} className="hover:text-brand-green">← Back to property</Link>
      </nav>

      <h1 className="font-display text-2xl font-bold text-charcoal dark:text-textPrimary">Review & pay</h1>
      <p className="mt-1 text-sm text-slateDark dark:text-textSecondary">
        {property.title} — {property.location.area ?? property.location.city}, {property.location.city}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="brand">{property.rentalPeriod}</Badge>
        {property.verification.nearaVerified && <Badge variant="success">NEARA Verified</Badge>}
        {property.listingSource === 'direct' ? (
          <Badge variant="info">Direct from landlord</Badge>
        ) : (
          <Badge variant="info">Authorized NEARA agent</Badge>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {preview?.feeCalculation && !preview.feeCalculation.withinLimit && (
        <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          This agent fee exceeds NEARA's permitted limit. The transaction has been blocked.
        </div>
      )}

      {preview?.feeCalculation && preview.feeCalculation.withinLimit && (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-300">
          Agent fee verified within NEARA's regulated limit.
        </div>
      )}

      <div className="mt-6 rounded-xl border border-line bg-white p-5 dark:border-inkBorder dark:bg-inkSoft">
        {preview ? (
          <PriceBreakdown breakdown={preview.breakdown} />
        ) : (
          <div className="space-y-2 text-sm text-slateDark dark:text-textSecondary">
            <p>Loading transparent cost breakdown…</p>
            <p>No hidden fees. All charges are disclosed before you pay.</p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-charcoal dark:text-textPrimary">Payment method</label>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                provider === p.value
                  ? 'border-brand-green bg-brand-green/10 text-brand-forest dark:text-brand-green'
                  : 'border-line text-slateDark hover:border-brand-green dark:border-inkBorder dark:text-textSecondary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="primary" loading={loading} onClick={onPay}>
          Proceed to gateway →
        </Button>
        <Link to={`/properties/${slug}`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate">
        Payments are verified server-side. NEARA never trusts frontend payment success. Your transaction is secured and idempotent.
      </p>
    </div>
  );
}
