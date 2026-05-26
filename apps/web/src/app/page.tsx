export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface text-gray-100">
      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <span className="text-lg font-bold tracking-tight">
          Blast<span className="text-brand-500">Radius</span>
        </span>
        <div className="flex items-center gap-4 text-sm">
          <a href="#pricing" className="text-gray-400 transition hover:text-white">Pricing</a>
          <a href="/api/auth/github" className="rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-500">Sign in</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-20 pt-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-700 bg-surface-overlay px-4 py-1.5 text-xs text-gray-400">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Now available for public beta
        </div>
        <h1 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Review AI-generated code
          <br />
          <span className="text-brand-500">10x faster</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400">
          BlastRadius maps every changed file to its downstream impact. Know exactly
          what breaks before you merge — whether the change was written by a human or an AI.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a href="https://github.com/apps/blastradius" className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-500">
            Install GitHub App
          </a>
          <a href="#how-it-works" className="rounded-lg border border-gray-700 px-6 py-3 font-medium text-gray-300 transition hover:border-gray-500">
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-gray-800 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { step: '1', title: 'Install the App', desc: 'Add BlastRadius to any repo in 30 seconds. No config needed — it auto-detects your project structure.' },
              { step: '2', title: 'Open a PR', desc: 'Every new PR or push triggers an analysis. The webhook returns instantly; the heavy work happens in the background.' },
              { step: '3', title: 'Get the Report', desc: 'A single auto-updating comment shows the blast radius, risk level, and an AI-written reviewer tip.' },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-gray-800 bg-surface-raised p-6">
                <div className="mb-3 text-2xl font-bold text-brand-500">{item.step}</div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-gray-800 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-center text-3xl font-bold">Simple pricing</h2>
          <p className="mt-3 text-center text-gray-400">Start free. Upgrade when you need more.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { tier: 'Free', price: '$0', desc: '1 public repo', cta: 'Get started', href: '/api/auth/github', featured: false },
              { tier: 'Startup', price: '$29', desc: 'Up to 5 private repos', cta: 'Start free trial', href: '/api/auth/github', featured: true },
              { tier: 'Enterprise', price: '$99', desc: 'Unlimited repos', cta: 'Contact us', href: 'mailto:sales@blastradius.dev', featured: false },
            ].map((plan) => (
              <div
                key={plan.tier}
                className={`rounded-xl border p-6 ${plan.featured ? 'border-brand-500 bg-brand-500/5' : 'border-gray-800 bg-surface-raised'}`}
              >
                <h3 className="text-lg font-semibold">{plan.tier}</h3>
                <div className="mt-3 text-3xl font-bold">{plan.price}<span className="text-base font-normal text-gray-400">/mo</span></div>
                <p className="mt-2 text-sm text-gray-400">{plan.desc}</p>
                <a
                  href={plan.href}
                  className={`mt-6 block rounded-lg px-4 py-2 text-center text-sm font-medium transition ${plan.featured ? 'bg-brand-600 text-white hover:bg-brand-500' : 'border border-gray-700 text-gray-300 hover:border-gray-500'}`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>BlastRadius &middot; Built for teams that ship fast</p>
      </footer>
    </div>
  );
}
