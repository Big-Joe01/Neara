import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Badge } from '@neara/ui';
import { useProperty, useCreateApplication } from '../lib/queries';
import { ApiError } from '../lib/auth';

const PERIODS = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
] as const;

export function ApplyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading } = useProperty(slug ?? '');
  const createApp = useCreateApplication();

  const [form, setForm] = useState({
    moveInDate: '',
    requestedPeriod: 'yearly' as 'yearly' | 'monthly' | 'quarterly' | 'weekly' | 'daily',
    employment: '',
    income: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!property) return;
    setLoading(true);
    try {
      const app = await createApp.mutateAsync({
        propertyId: property.id,
        moveInDate: form.moveInDate,
        requestedPeriod: form.requestedPeriod,
        employment: form.employment || undefined,
        income: form.income ? Number(form.income) : undefined,
      });
      navigate(`/properties/${slug}/pay?applicationId=${app.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Application failed');
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

      <h1 className="font-display text-2xl font-bold text-charcoal dark:text-textPrimary">Apply for this property</h1>
      <p className="mt-1 text-sm text-slateDark dark:text-textSecondary">
        {property.title} — {property.location.area ?? property.location.city}, {property.location.city}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="brand">{property.rentalPeriod}</Badge>
        {property.verification.nearaVerified && <Badge variant="success">NEARA Verified</Badge>}
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Desired move-in date</label>
          <Input type="date" value={form.moveInDate} onChange={set('moveInDate')} required min={new Date().toISOString().split('T')[0]} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Rental period</label>
          <select
            value={form.requestedPeriod}
            onChange={set('requestedPeriod')}
            className="h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-charcoal outline-none focus:border-brand-green dark:border-inkBorder dark:bg-inkSoft dark:text-textPrimary"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Employment status <span className="text-slate">(optional)</span></label>
          <Input value={form.employment} onChange={set('employment')} placeholder="e.g. Software Engineer at Tech Co." maxLength={200} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-charcoal dark:text-textPrimary">Monthly income (₦) <span className="text-slate">(optional)</span></label>
          <Input type="number" value={form.income} onChange={set('income')} placeholder="e.g. 500000" min={0} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" variant="primary" loading={loading}>Submit application</Button>
          <Link to={`/properties/${slug}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
