'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingStep2() {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4cd7f6 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="w-full max-w-5xl z-10 space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-outline-variant/20 mb-2">
            <span className="text-secondary text-xs font-bold tracking-widest uppercase">Infrastructure Protocol</span>
          </div>
          <h1 className="font-headline text-4xl md:text-6xl font-bold tracking-tighter leading-none">
            SELECT YOUR <span className="text-primary">FORGE</span>
          </h1>
          <p className="text-on-surface-variant max-w-xl mx-auto text-lg leading-relaxed">
            Choose between cloud clusters or your own hardware.
          </p>
        </header>

        {/* Progress */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex justify-between">
            <span className="font-headline text-xs font-bold tracking-widest text-primary uppercase">Stage 02</span>
            <span className="font-headline text-xs font-bold tracking-widest text-on-surface-variant">50% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-primary" />
          </div>
          <div className="flex justify-between text-xs text-outline uppercase font-bold">
            <span className="text-tertiary">Identity</span>
            <span className="text-secondary">Infrastructure</span>
            <span>Agent</span>
            <span>Launch</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { id: 'cloud', title: 'Cloud Providers', desc: 'AWS, Azure, GCP, Vercel — automated orchestration across global regions.', badges: ['AWS', 'Azure', 'GCP'], color: 'primary' },
            { id: 'bare-metal', title: 'Bare Metal / VPS', desc: 'OVH, Hetzner, or your own server — direct access, maximum control.', badges: ['OVH', 'Hetzner', 'Custom'], color: 'secondary' },
          ].map((card) => (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className={`group relative flex flex-col text-left p-8 rounded-xl transition-all duration-300 border ${
                selected === card.id
                  ? `border-${card.color}/60 bg-surface-container-high shadow-[0_0_30px_rgba(208,188,255,0.15)]`
                  : 'border-transparent bg-surface-container-low hover:bg-surface-container-high hover:scale-[1.02]'
              }`}
            >
              <h3 className={`font-headline text-2xl font-bold mb-3 ${selected === card.id ? `text-${card.color}` : 'text-on-surface'}`}>
                {card.title}
              </h3>
              <p className="text-on-surface-variant text-sm leading-relaxed mb-6">{card.desc}</p>
              <div className="flex gap-3 mt-auto">
                {card.badges.map((b) => (
                  <span key={b} className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{b}</span>
                ))}
              </div>
            </button>
          ))}
        </div>

        <footer className="flex items-center justify-between pt-8 border-t border-outline-variant/10">
          <button onClick={() => router.back()} className="text-on-surface-variant text-sm font-bold hover:text-on-surface transition-colors">
            ← Go Back
          </button>
          <button
            onClick={() => router.push('/onboarding/step-3')}
            disabled={!selected}
            className="px-8 py-3 rounded-xl bg-primary text-on-primary font-headline font-bold text-sm tracking-tight shadow-[0_0_15px_rgba(208,188,255,0.3)] hover:shadow-[0_0_25px_rgba(208,188,255,0.5)] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed uppercase"
          >
            Proceed to Agent Setup →
          </button>
        </footer>
      </main>
    </div>
  );
}
