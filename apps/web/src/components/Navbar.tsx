import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Logo, Button } from '@neara/ui';
import { useTheme } from '../hooks/useTheme';

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const dashLink = user
    ? user.role === 'ADMIN' ? '/admin' : user.role === 'LANDLORD' ? '/dashboard/landlord' : user.role === 'AGENT' ? '/dashboard/agent' : '/dashboard'
    : null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/80 backdrop-blur-md dark:border-inkBorder dark:bg-ink/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2" aria-label="NEARA home">
          <Logo variant="symbol" className="h-9 w-9" />
          <span className="font-display text-xl font-bold text-charcoal dark:text-textPrimary">NEARA</span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to="/search" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-brand-green' : 'text-slateDark hover:text-charcoal dark:text-textSecondary dark:hover:text-textPrimary'}`}>
            Search
          </NavLink>
          <NavLink to="/how-it-works" className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-brand-green' : 'text-slateDark hover:text-charcoal dark:text-textSecondary dark:hover:text-textPrimary'}`}>
            How it works
          </NavLink>
          {user && dashLink && (
            <NavLink to={dashLink} className={({ isActive }) => `text-sm font-medium transition-colors ${isActive ? 'text-brand-green' : 'text-slateDark hover:text-charcoal dark:text-textSecondary dark:hover:text-textPrimary'}`}>
              Dashboard
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate hover:bg-mist dark:hover:bg-inkPanel"
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                  {user.displayName}
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
