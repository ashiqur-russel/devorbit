'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingStep1() {
  const [name, setName] = useState('');
  const router = useRouter();

  const handleContinue = () => {
    if (!name.trim()) return;
    localStorage.setItem('devorbit_workspace_name', name);
    router.push('/onboarding/step-2');
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col">
      {/* Cyber grid */}
      <div className="fixed inset-0 cyber-grid -z-10" />
      <div className="fixed inset-0 bg-gradient-to-tr from-background via-surface-container-lowest to-background opacity-80 -z-10" />
      <div className="fixed -top-12 -left-12 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -z-10" />
      <div className="fixed -bottom-12 -right-12 w-48 h-48 bg-secondary/10 blur-[80px] rounded-full -z-10" />

      <header className="w-full px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-primary tracking-tighter font-headline uppercase">DevOrbit</span>
          <span className="text-xs bg-secondary-container/20 text-secondary px-2 py-0.5 rounded font-mono border border-secondary/20">V1.0_INIT</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-xl">
          <div className="relative bg-surface-container-low rounded-xl shadow-2xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-2 w-full bg-surface-container-highest flex">
              <div className="w-1/4 bg-primary h-full scanline-progress" />
            </div>

            <div className="p-8 md:p-12">
              <div className="mb-10">
                <span className="text-secondary font-headline font-bold text-xs tracking-widest uppercase mb-3 block">
                  Initialization Sequence
                </span>
                <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface tracking-tighter leading-tight">
                  Build Your <br />
                  <span className="text-primary">Command Center</span>.
                </h1>
                <p className="mt-4 text-on-surface-variant text-sm leading-relaxed max-w-md">
                  Welcome to DevOrbit. Let&apos;s begin by defining your workspace identity.
                </p>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-xs font-headline font-bold text-outline-variant uppercase tracking-widest mb-3 group-focus-within:text-primary transition-colors">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
                    placeholder="e.g. ashiqur&apos;s team"
                    className="w-full bg-surface-container-lowest border border-transparent focus:border-primary/50 rounded-xl py-4 px-5 text-on-surface placeholder:text-outline-variant focus:ring-0 focus:outline-none transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleContinue}
                    disabled={!name.trim()}
                    className="w-full bg-primary text-on-primary-container font-headline font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:shadow-[0_0_20px_rgba(208,188,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-tighter"
                  >
                    Continue →
                  </button>
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="bg-surface-container-high/50 px-8 py-5 flex items-center justify-between border-t border-white/5">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 w-8 rounded-full ${i === 0 ? 'bg-primary' : 'bg-surface-container-highest'}`} />
                ))}
              </div>
              <span className="text-xs font-headline font-bold text-outline uppercase tracking-widest">
                Phase 01 <span className="text-on-surface-variant">/ 04</span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
