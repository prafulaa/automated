export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-bg text-white selection:bg-brand">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-mono text-sm font-medium uppercase tracking-wider">
          BlastRadius
        </span>
        <div className="flex items-center gap-4">
          <a href="#pricing" className="text-sm text-zinc-400 transition hover:text-white">
            Pricing
          </a>
          <a
            href="/api/auth/github"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium text-white transition hover:bg-surface-overlay"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-24 pt-28 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-overlay px-4 py-1.5 text-xs text-zinc-400">
          <span className="h-2 w-2 rounded-full bg-brand" />
          Now available for public beta
        </div>
        <h1 className="font-display text-5xl tracking-tight text-white md:text-7xl">
          Review AI-generated code
          <br />
          <span className="text-brand">10x faster</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400">
          Stop regressions before they merge. BlastRadius maps every changed file to its
          downstream impact so your team knows exactly what breaks.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="https://github.com/apps/blastradius"
            className="rounded-md bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
          >
            Install GitHub app
          </a>
          <a
            href="#how-it-works"
            className="rounded-md border border-border px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-500"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl tracking-tight text-white">How it works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Install the app',
                desc: 'Add BlastRadius to any repo in 30 seconds. No config needed — it auto-detects your project structure.',
              },
              {
                step: '2',
                title: 'Open a pull request',
                desc: 'Every new PR or push triggers an analysis. The webhook returns instantly; heavy work runs in the background.',
              },
              {
                step: '3',
                title: 'Review the blast radius',
                desc: 'A single auto-updating comment shows the risk level, impacted files, and an AI-written reviewer tip.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-surface p-6"
              >
                <div className="mb-4 h-8 w-8 rounded border border-border bg-surface-overlay flex items-center justify-center">
                  <span className="font-mono text-xs text-brand">{item.step}</span>
                </div>
                <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-display text-3xl tracking-tight text-white">Simple pricing</h2>
          <p className="mt-3 text-sm text-zinc-400">Start free. Upgrade when you need more.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                tier: 'Free',
                price: '$0',
                desc: '1 public repository',
                cta: 'Get started',
                href: '/api/auth/github',
                featured: false,
              },
              {
                tier: 'Startup',
                price: '$29',
                desc: 'Up to 5 private repos',
                cta: 'Start free trial',
                href: '/api/auth/github',
                featured: true,
              },
              {
                tier: 'Enterprise',
                price: '$99',
                desc: 'Unlimited repositories',
                cta: 'Contact us',
                href: 'mailto:sales@blastradius.dev',
                featured: false,
              },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`flex flex-col gap-6 rounded-lg border p-8 ${
                  plan.featured
                    ? 'relative overflow-hidden border-brand bg-brand/5'
                    : 'border-border bg-surface'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -right-10 top-5 rotate-45 bg-brand px-10 py-0.5 text-[10px] font-medium uppercase text-white">
                    Popular
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-white">{plan.tier}</h3>
                  <div className="mt-3">
                    <span className="font-display text-4xl text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-400">/mo</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">{plan.desc}</p>
                </div>
                <a
                  href={plan.href}
                  className={`mt-auto block rounded-md px-4 py-2.5 text-center text-sm font-medium transition-colors ${
                    plan.featured
                      ? 'bg-brand text-white hover:bg-brand-hover'
                      : 'border border-border text-zinc-300 hover:border-zinc-500'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 text-center text-sm text-zinc-500">
        <div className="flex items-center justify-center gap-6">
          <a href="/privacy" className="hover:text-zinc-300 transition">
            Privacy
          </a>
          <a href="mailto:support@blastradius.dev" className="hover:text-zinc-300 transition">
            Contact
          </a>
        </div>
        <p className="mt-4">BlastRadius &middot; Built for teams that ship fast</p>
      </footer>
    </div>
  );
}
