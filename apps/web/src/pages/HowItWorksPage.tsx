export function HowItWorksPage() {
  const steps = [
    { n: 1, title: 'Search', desc: 'Find verified homes by location, price, and type across Lagos.' },
    { n: 2, title: 'Verify', desc: 'See verification badges, landlord/agent status, and transparent fees.' },
    { n: 3, title: 'Inspect', desc: 'Request a property inspection at a time that works for you.' },
    { n: 4, title: 'Apply', desc: 'Submit your application with the documents required.' },
    { n: 5, title: 'Pay', desc: 'See the full cost breakdown upfront — no hidden fees — and pay securely.' },
    { n: 6, title: 'Sign', desc: 'Review and digitally sign your tenancy agreement.' },
    { n: 7, title: 'Move in', desc: 'Download your agreement and receipts. Welcome home.' },
  ];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-charcoal dark:text-textPrimary">How NEARA works</h1>
      <p className="mt-2 text-slate">From search to move-in — simple, transparent, and secure.</p>
      <div className="mt-8 space-y-4">
        {steps.map((s) => (
          <div key={s.n} className="flex gap-4 rounded-lg border border-line bg-white p-4 dark:border-inkBorder dark:bg-inkSoft">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-green text-white font-bold">{s.n}</div>
            <div>
              <h2 className="font-display text-lg font-semibold text-charcoal dark:text-textPrimary">{s.title}</h2>
              <p className="text-sm text-slateDark dark:text-textSecondary">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div id="agent-fees" className="mt-12 rounded-xl bg-brand-forest p-8 text-white">
        <h2 className="font-display text-xl font-bold">Regulated agent fees</h2>
        <p className="mt-2 text-white/80">
          NEARA enforces admin-configured maximum agent fees by rent band. Agents cannot charge above the permitted limit, and all charges are disclosed before payment. This keeps housing affordable and transparent.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/10 p-4">
            <p className="text-sm text-white/70">₦0 – ₦500k</p>
            <p className="font-bold">5% max · ₦25k cap</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4">
            <p className="text-sm text-white/70">₦500k – ₦1M</p>
            <p className="font-bold">5% max · ₦50k cap</p>
          </div>
          <div className="rounded-lg bg-white/10 p-4">
            <p className="text-sm text-white/70">₦1M+</p>
            <p className="font-bold">Admin-configured</p>
          </div>
        </div>
      </div>
    </div>
  );
}
