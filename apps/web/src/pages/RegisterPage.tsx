import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, ApiError } from '../lib/auth';
import { Button, Input, Logo } from '@neara/ui';
import type { UserRole } from '@neara/types';

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'CUSTOMER', label: 'Tenant / Customer', desc: 'Find and rent homes' },
  { value: 'LANDLORD', label: 'Landlord', desc: 'List and manage properties' },
  { value: 'AGENT', label: 'Housing Agent', desc: 'Represent authorized properties' },
];

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<UserRole>((params.get('role') as UserRole) ?? 'CUSTOMER');
  const [form, setForm] = useState({ displayName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register({ ...form, role });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <Logo variant="symbol" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 font-display text-2xl font-bold text-charcoal dark:text-textPrimary">Create your account</h1>
        <p className="mt-1 text-sm text-slate">Join NEARA — one tap from home</p>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {roles.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => setRole(r.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${role === r.value ? 'border-brand-green bg-brand-greenSoft dark:bg-brand-green/10' : 'border-line dark:border-inkBorder'}`}
          >
            <p className="text-sm font-medium text-charcoal dark:text-textPrimary">{r.label}</p>
            <p className="text-xs text-slate">{r.desc}</p>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Full name" name="displayName" value={form.displayName} onChange={set('displayName')} required />
        <Input label="Email" type="email" name="email" value={form.email} onChange={set('email')} required />
        <Input label="Phone" name="phone" value={form.phone} onChange={set('phone')} placeholder="0801..." required />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Password" type="password" name="password" value={form.password} onChange={set('password')} required />
          <Input label="Confirm" type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} required />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>Create account</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate">
        Have an account? <Link to="/login" className="font-medium text-brand-green hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
