import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-on-surface overflow-hidden">
      {/* Cyber grid background */}
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />
      <div className="fixed top-0 left-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-1/3 h-1/3 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-surface-container-lowest/60 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 h-16 max-w-7xl mx-auto">
          <span className="text-2xl font-black tracking-tighter text-primary font-headline uppercase">
            DevOrbit
          </span>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">Features</a>
            <a href="#how-it-works" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">How it works</a>
            <a href="#faq" className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider">FAQ</a>
            <a
              href="https://github.com/ashiqur-russel/devorbit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium uppercase tracking-wider"
            >
              GitHub
            </a>
          </div>
          <Link
            href="/login"
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-xl font-bold font-headline uppercase tracking-tighter hover:shadow-[0_0_15px_rgba(160,120,255,0.4)] transition-all text-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative pt-16">
        <section className="max-w-7xl mx-auto px-6 pt-32 pb-24 flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2 space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high/60 border border-outline-variant/20 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-xs uppercase tracking-widest font-bold text-secondary">Open Source · Self-hosted</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black tracking-tighter leading-none text-on-surface font-headline">
              Your Stack.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-tertiary">
                All in One Place.
              </span>
            </h1>

            <p className="text-xl text-on-surface-variant max-w-xl font-light leading-relaxed">
              Monitor CI/CD pipelines, server health, and deployments in a single
              cyber-industrial dashboard. Built for students and indie developers.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-primary text-on-primary font-bold rounded-xl text-lg uppercase tracking-tighter shadow-[0_0_20px_rgba(208,188,255,0.3)] hover:shadow-[0_0_35px_rgba(208,188,255,0.5)] transition-all font-headline"
              >
                Start Monitoring Free
              </Link>
              <a
                href="https://github.com/ashiqur-russel/devorbit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 glass-panel border border-outline-variant/30 text-secondary font-bold rounded-xl text-lg uppercase tracking-tighter hover:bg-surface-container-highest transition-all font-headline"
              >
                Star on GitHub
              </a>
            </div>
          </div>

          {/* Hero visual placeholder */}
          <div className="w-full lg:w-1/2">
            <div className="relative rounded-xl overflow-hidden border border-outline-variant/20 bg-surface-container-low shadow-2xl aspect-video flex items-center justify-center">
              <div className="text-outline text-sm font-mono">[ Dashboard Preview ]</div>
              <div className="absolute bottom-0 left-0 w-full h-1 scanline-progress" />
            </div>
          </div>
        </section>

        {/* Integrations strip */}
        <section className="border-y border-outline-variant/10 py-6">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-xs uppercase tracking-widest text-outline mb-6">Works with</p>
            <div className="flex justify-center gap-12 text-on-surface-variant text-sm font-bold uppercase tracking-widest">
              {['GitHub', 'GitLab', 'Vercel', 'Docker', 'OVH', 'AWS'].map((name) => (
                <span key={name} className="opacity-50 hover:opacity-100 transition-opacity">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-surface-container-low">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16 space-y-3">
              <span className="text-tertiary font-bold tracking-widest uppercase text-xs">Functional Modules</span>
              <h2 className="text-4xl font-black tracking-tighter font-headline">Engineered for Clarity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { color: 'secondary', title: 'CI/CD Pipelines', desc: 'Track GitHub Actions and GitLab CI runs. See pass/fail status, duration, and history at a glance.', icon: '⚡' },
                { color: 'primary', title: 'Server Health', desc: 'Real-time CPU, RAM, and disk metrics from a one-command agent. Live charts, process list, system logs.', icon: '📡' },
                { color: 'tertiary', title: 'Deployment Registry', desc: 'See every app, where it runs, and its current status. Vercel, OVH, AWS, or your own server.', icon: '🚀' },
              ].map((f) => (
                <div key={f.title} className="group bg-surface-container-high p-8 rounded-xl hover:-translate-y-1 transition-all duration-300">
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="text-xl font-bold mb-3 font-headline">{f.title}</h3>
                  <p className="text-on-surface-variant font-light leading-relaxed text-sm">{f.desc}</p>
                  <div className={`mt-6 h-1 bg-surface-container-highest rounded-full overflow-hidden`}>
                    <div className={`h-full w-2/3 group-hover:w-full transition-all duration-500 bg-${f.color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works (anchor for nav) */}
        <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-24">
          <div className="text-center mb-12 space-y-3">
            <span className="text-secondary font-bold tracking-widest uppercase text-xs">Self-host</span>
            <h2 className="text-4xl font-black tracking-tighter font-headline">How it works</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto text-sm leading-relaxed">
              Run the API and web with Docker Compose on your VPS, connect GitHub, install the agent on your servers, and
              use the dashboard for pipelines, metrics, and deployments.
            </p>
          </div>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto list-none">
            {[
              { step: '01', title: 'Deploy stack', body: 'Clone the repo, copy `.env`, run `docker compose up` (or your VPS playbook).' },
              { step: '02', title: 'Connect & agent', body: 'Sign in with GitHub or email, create a team, then run the one-line agent install on each server.' },
              { step: '03', title: 'Ship with confidence', body: 'Watch CI runs, server health, and deployment records from one place.' },
            ].map((row) => (
              <li key={row.step} className="relative pl-14 border-l border-outline-variant/20">
                <span className="absolute left-0 top-0 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant/30 text-xs font-black font-headline text-primary">
                  {row.step}
                </span>
                <h3 className="text-lg font-bold font-headline mb-2">{row.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{row.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Stats */}
        <section className="border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-outline-variant/10">
            {[
              { val: '1 cmd', label: 'Agent install', color: 'secondary' },
              { val: 'MIT', label: 'Open source license', color: 'primary' },
              { val: '< 5s', label: 'Metric latency', color: 'tertiary' },
              { val: '100%', label: 'Self-hostable', color: 'on-surface-variant' },
            ].map((s) => (
              <div key={s.label} className="px-8 py-10 text-center">
                <div className="text-4xl font-black tracking-tighter">{s.val}</div>
                <div className={`text-xs uppercase tracking-widest text-${s.color} mt-2`}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-24 bg-surface-container-low border-y border-outline-variant/10 scroll-mt-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-12 space-y-3">
              <span className="text-tertiary font-bold tracking-widest uppercase text-xs">Self-hosted CD</span>
              <h2 className="text-4xl font-black tracking-tighter font-headline">FAQ</h2>
              <p className="text-on-surface-variant text-sm max-w-xl mx-auto leading-relaxed">
                Quick answers for operators hosting DevOrbit and using GitHub Actions to release to a VPS.
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  q: 'Where is the manual “deploy” button?',
                  a: (
                    <>
                      It lives in GitHub, not inside this app. Open the{' '}
                      <a
                        href="https://github.com/ashiqur-russel/devorbit/actions/workflows/deploy-vps.yml"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline-offset-2 hover:underline font-medium"
                      >
                        Deploy to VPS
                      </a>{' '}
                      workflow → use <strong className="text-on-surface">Run workflow</strong> (branch <code className="text-xs bg-surface-container-highest px-1.5 py-0.5 rounded">main</code>) after{' '}
                      <strong className="text-on-surface">CI</strong> is green on that commit. That single click starts the SSH + Docker deploy on your server.
                    </>
                  ),
                },
                {
                  q: 'Does pushing to main automatically deploy to my server?',
                  a: 'No. CI runs on push; production deploy only runs when someone runs the Deploy to VPS workflow manually. That keeps releases intentional.',
                },
                {
                  q: 'What should I do before clicking Run workflow?',
                  a: 'Wait for the latest CI run on main to finish successfully, merge anything you need, then trigger deploy so the VPS pulls the same commit you verified in CI.',
                },
                {
                  q: 'What if the deploy job fails?',
                  a: 'The workflow is configured to roll the VPS git checkout and Docker stack back to the last working commit when a step fails (see the repo workflow file). Check Actions logs and docker compose logs on the server.',
                },
              ].map((item) => (
                <details
                  key={item.q}
                  className="group rounded-xl border border-outline-variant/20 bg-surface-container-high/40 open:bg-surface-container-high/80 transition-colors"
                >
                  <summary className="cursor-pointer list-none px-5 py-4 font-headline font-bold text-sm uppercase tracking-wide text-on-surface flex items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span className="text-primary text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <div className="px-5 pb-4 pt-0 text-on-surface-variant text-sm leading-relaxed border-t border-outline-variant/10">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="relative rounded-3xl overflow-hidden bg-surface-container-lowest border border-outline-variant/20 p-12 text-center space-y-6">
            <h2 className="text-4xl font-black tracking-tighter text-primary font-headline">Start in 60 seconds</h2>
            <p className="text-on-surface-variant max-w-lg mx-auto">
              Connect GitHub, install the agent with one npx command, and your dashboard is live.
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-4 bg-primary text-on-primary font-bold rounded-xl uppercase tracking-tighter font-headline hover:shadow-[0_0_30px_rgba(208,188,255,0.4)] transition-all"
            >
              Continue with GitHub
            </Link>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-30" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 py-8 bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="text-outline text-xs uppercase tracking-widest">© 2026 DevOrbit. MIT License.</span>
          <div className="flex gap-8 text-xs uppercase tracking-widest text-outline">
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a
              href="https://github.com/ashiqur-russel/devorbit"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              GitHub
            </a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
