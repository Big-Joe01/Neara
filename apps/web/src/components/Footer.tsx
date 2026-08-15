import { Link } from 'react-router-dom';
import { Logo } from '@neara/ui';

export function Footer() {
  return (
    <footer className="border-t border-line bg-cloud dark:border-inkBorder dark:bg-inkSoft">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo variant="horizontal" className="h-8" />
            <p className="mt-3 text-sm text-slate">One tap from home. Transparent housing for Lagos and beyond.</p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-charcoal dark:text-textPrimary">Explore</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><Link to="/search" className="hover:text-brand-green">Search properties</Link></li>
              <li><Link to="/how-it-works" className="hover:text-brand-green">How it works</Link></li>
              <li><Link to="/search?listingSource=direct" className="hover:text-brand-green">Direct from landlord</Link></li>
              <li><Link to="/search?verified=true" className="hover:text-brand-green">Verified homes</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-charcoal dark:text-textPrimary">For providers</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><Link to="/register?role=LANDLORD" className="hover:text-brand-green">List as landlord</Link></li>
              <li><Link to="/register?role=AGENT" className="hover:text-brand-green">Join as agent</Link></li>
              <li><Link to="/how-it-works#agent-fees" className="hover:text-brand-green">Agent fee rules</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-charcoal dark:text-textPrimary">Company</h4>
            <ul className="space-y-2 text-sm text-slate">
              <li><Link to="/about" className="hover:text-brand-green">About NEARA</Link></li>
              <li><Link to="/contact" className="hover:text-brand-green">Contact</Link></li>
              <li><Link to="/legal" className="hover:text-brand-green">Terms & Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-6 text-xs text-slate dark:border-inkBorder">
          <p>© {new Date().getFullYear()} NEARA. NEARA is a digital platform and recording party, not a licensed legal professional or notary.</p>
        </div>
      </div>
    </footer>
  );
}
