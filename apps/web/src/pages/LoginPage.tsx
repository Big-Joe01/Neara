import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, ApiError } from '../lib/auth';
import { Button, Input, Logo } from '@neara/ui';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(identifier, password);
      navigate(params.get('redirect') ?? '/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <Logo variant="symbol" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 font-display text-2xl font-bold text-charcoal dark:text-textPrimary">Welcome back</h1>
        <p className="mt-1 text-sm text-slate">Sign in to your NEARA account</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email or phone"
          name="identifier"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="you@example.com"
          required
          autoFocus
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" fullWidth size="lg" loading={loading}>Sign in</Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate">
        No account? <Link to="/register" className="font-medium text-brand-green hover:underline">Create one</Link>
      </p>
      <div className="mt-6 rounded-md bg-cloud p-3 text-xs text-slate dark:bg-inkPanel">
        <p className="font-medium text-slateDark dark:text-textSecondary">Demo accounts:</p>
        <p>customer@neara.app · landlord@neara.app · agent@neara.app · admin@neara.app</p>
        <p>Password: Password123</p>
      </div>
    </div>
  );
}
