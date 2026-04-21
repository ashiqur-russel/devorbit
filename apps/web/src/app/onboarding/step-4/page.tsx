'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingStep4() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push('/dashboard'), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6">
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Left: visual */}
        <div className="md:col-span-5 relative flex flex-col justify-center items-center rounded-xl bg-surface-container-low min-h-[400px] shadow-[0_0_40px_-10px_rgba(76,215,246,0.15)] overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-surface-container-high border-2 border-secondary/30 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-secondary/10 blur-xl animate-pulse" />
              <span className="text-6xl">✓</span>
            </div>
            <div className="mt-8 text-center px-6">
              <h2 className="font-headline text-3xl font-black text-primary tracking-tighter uppercase mb-2">
                System Linked
              </h2>
              <p className="text-on-surface-variant font-medium tracking-tight text-sm">
                Terminal environment ready for deployment.
              </p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 scanline-progress" />
        </div>

        {/* Right: checklist */}
        <div className="md:col-span-7 flex flex-col justify-between py-4">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-headline text-5xl font-bold text-primary tracking-tighter">04</span>
                <div className="h-8 w-px bg-outline-variant" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-outline block">Phase</span>
                  <span className="font-headline text-sm font-bold uppercase text-on-surface">Setup Complete</span>
                </div>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full bg-primary ${i === 3 ? 'w-12' : 'w-6'}`} />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { title: 'Workspace Created', desc: 'Your team workspace is provisioned.' },
                { title: 'Agent Configured', desc: 'Ready to receive server metrics.' },
              ].map((item) => (
                <div key={item.title} className="bg-surface-container p-5 rounded-xl border-l-4 border-tertiary hover:bg-surface-container-high transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline font-bold text-lg text-on-surface tracking-tight">{item.title}</h3>
                      <p className="text-xs text-on-surface-variant mt-1">{item.desc}</p>
                    </div>
                    <span className="text-tertiary text-xl">✓</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 font-mono text-xs text-on-surface-variant/70 space-y-1">
              <p><span className="text-secondary">$</span> devorbit --status: <span className="text-tertiary">ALL_SYSTEMS_GO</span></p>
              <p><span className="text-secondary">$</span> secure_tunnel: <span className="text-tertiary">ACTIVE</span></p>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="relative group w-full py-5 bg-secondary-container text-on-secondary-container font-headline font-black text-xl uppercase tracking-tighter rounded-xl transition-all active:scale-95 shadow-[0_0_30px_-5px_rgba(3,181,211,0.5)] hover:shadow-[0_0_40px_rgba(3,181,211,0.7)] overflow-hidden"
            >
              <span className="relative z-10">Enter Dashboard →</span>
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 skew-x-12" />
            </button>
            <p className="text-center text-xs text-outline font-bold uppercase tracking-widest">
              Auto-redirecting in 5 seconds...
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
