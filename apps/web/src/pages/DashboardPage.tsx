import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Button, Card, EmptyState } from '@neara/ui';
import { useFavorites, type FavoriteItem } from '../lib/queries';

export function DashboardPage() {
  const { user } = useAuth();
  const { data: favs } = useFavorites();

  if (!user) return null;

  const roleDashboards: Record<string, { title: string; items: { label: string; href: string }[] }> = {
    CUSTOMER: {
      title: 'My home search',
      items: [
        { label: 'Search homes', href: '/search' },
        { label: 'Saved properties', href: '/dashboard/saved' },
        { label: 'My inspections', href: '/dashboard/inspections' },
        { label: 'My applications', href: '/dashboard/applications' },
        { label: 'Messages', href: '/dashboard/messages' },
      ],
    },
    LANDLORD: {
      title: 'Landlord dashboard',
      items: [
        { label: 'My properties', href: '/dashboard/landlord/properties' },
        { label: 'Applications', href: '/dashboard/landlord/applications' },
        { label: 'Inspections', href: '/dashboard/landlord/inspections' },
        { label: 'Payments', href: '/dashboard/landlord/payments' },
        { label: 'Messages', href: '/dashboard/messages' },
      ],
    },
    AGENT: {
      title: 'Agent dashboard',
      items: [
        { label: 'My properties', href: '/dashboard/agent/properties' },
        { label: 'Inspections', href: '/dashboard/agent/inspections' },
        { label: 'Authorizations', href: '/dashboard/agent/authorizations' },
        { label: 'Messages', href: '/dashboard/messages' },
      ],
    },
    ADMIN: {
      title: 'Admin',
      items: [{ label: 'Open admin dashboard', href: '/admin' }],
    },
  };

  const dash = roleDashboards[user.role] ?? roleDashboards.CUSTOMER;
  if (!dash) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-charcoal dark:text-textPrimary">
          Hello, {user.displayName}
        </h1>
        <p className="text-sm text-slate">{dash.title}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dash.items.map((item) => (
          <Link key={item.href} to={item.href}>
            <Card hoverable className="flex items-center justify-between">
              <span className="font-medium text-charcoal dark:text-textPrimary">{item.label}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate" aria-hidden><path d="M9 18l6-6-6-6" /></svg>
            </Card>
          </Link>
        ))}
      </div>

      {user.role === 'CUSTOMER' && (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-lg font-semibold text-charcoal dark:text-textPrimary">Saved properties</h2>
          {favs && favs.length > 0 ? (
            <p className="text-sm text-slate">{favs.length} saved {favs.length === 1 ? 'property' : 'properties'}</p>
          ) : (
            <EmptyState
              title="No saved homes yet"
              description="Tap the heart on any property to save it here."
              action={<Link to="/search"><Button size="sm">Browse homes</Button></Link>}
            />
          )}
        </div>
      )}

      {!user.isEmailVerified && (
        <div className="mt-6 rounded-md border border-warning/30 bg-warningBg p-4 text-sm text-warning dark:bg-warning/10">
          Please verify your email to unlock all features.
        </div>
      )}
    </div>
  );
}
