'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getAgentInstallCommand } from '@/lib/agent-install-command';
import { useAgentInstallBootstrap } from '@/hooks/use-agent-install-bootstrap';
import AgentStopCommands from '@/components/agent/AgentStopCommands';

export default function OnboardingStep3() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const pendingCopy = useRef(false);
  const router = useRouter();
  const { agentToken, provisioning, error, connected, trigger } = useAgentInstallBootstrap({ autoCreate: false });

  const { full, display } = useMemo(() => getAgentInstallCommand(agentToken), [agentToken]);

  // Auto-copy once token arrives after the user clicked "Get Token"
  useEffect(() => {
    if (agentToken && pendingCopy.current) {
      pendingCopy.current = false;
      copyTextToClipboard(full).then((ok) => {
        if (ok) { setCopied(true); setTimeout(() => setCopied(false), 2000); }
        else setCopyError(true);
      });
    }
  }, [agentToken, full]);

  const handleCopy = async () => {
    if (!agentToken) {
      pendingCopy.current = true;
      trigger();
      return;
    }
    setCopyError(false);
    const ok = await copyTextToClipboard(full);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopyError(true);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-6 relative">
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d0bcff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      <div className="fixed top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-1/4 h-1/2 bg-gradient-to-tr from-secondary/5 to-transparent pointer-events-none" />

      <main className="w-full max-w-4xl flex flex-col items-center z-10">
        <div className="text-center mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tighter mb-4 uppercase">
            Agent Installation
          </h1>
          <p className="text-on-surface-variant max-w-md mx-auto text-lg leading-relaxed">
            Run this command on any server you want to monitor. It includes <code className="text-tertiary">--background</code> so
            your shell returns right away — <strong className="text-on-surface">npx does not reinstall</strong> each time. To stop
            the agent later, use the printed <code className="text-tertiary">kill</code> line or the commands below (also on{' '}
            <strong className="text-on-surface">Settings → Agent</strong>).
          </p>
        </div>

        {/* Progress */}
        <div className="w-full max-w-md mb-12">
          <div className="flex justify-between mb-2">
            <span className="font-headline text-xs font-bold text-primary uppercase tracking-widest">Phase 03</span>
            <span className="font-headline text-xs text-on-surface-variant">75% Complete</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full w-3/4 bg-primary rounded-full" />
          </div>
        </div>

        {error && (
          <p className="mb-6 text-sm text-error max-w-lg text-center font-mono">{error}</p>
        )}

        {/* Terminal */}
        <div className="w-full rounded-xl overflow-hidden shadow-2xl border border-outline-variant/10">
          <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-error/40" />
              <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim/40" />
              <div className="w-3 h-3 rounded-full bg-tertiary-fixed-dim/40" />
            </div>
            <span className="text-xs font-mono text-outline uppercase tracking-widest">bash — devorbit-agent</span>
            <div className="w-12" />
          </div>

          <div className="bg-surface-container-lowest p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 font-mono text-sm leading-loose min-w-0">
              <span className="text-secondary mr-3">$</span>
              <code className="text-on-surface break-all">
                {provisioning ? '… preparing install command …' : agentToken ? display : 'Click "Get Token" to generate your install command'}
              </code>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={provisioning}
              className="flex items-center gap-2 bg-primary text-on-primary-container px-6 py-3 rounded-xl font-headline font-bold text-sm uppercase tracking-tight transition-all active:scale-95 hover:shadow-[0_0_20px_rgba(208,188,255,0.3)] shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? '✓ Copied!' : agentToken ? '⧉ Copy Command' : '⚡ Get Token'}
            </button>
          </div>
          {copyError && (
            <p className="px-8 pb-4 text-xs text-error font-mono">
              Copy failed (common on locked-down browsers). Select the command above and copy manually, or use HTTPS.
            </p>
          )}
        </div>

        <div className="mt-8 w-full max-w-2xl text-left">
          <h3 className="mb-2 font-headline text-[10px] font-bold uppercase tracking-widest text-outline">
            Stopping the agent later
          </h3>
          <AgentStopCommands />
          <p className="mt-2 text-center text-[11px] text-outline">
            Same instructions anytime under{' '}
            <strong className="text-on-surface-variant">Settings → Agent</strong>.
          </p>
        </div>

        {/* Connection status — was static; now reflects API poll */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div
            className={`flex items-center gap-4 px-6 py-4 rounded-full border ${
              connected
                ? 'bg-secondary/10 border-secondary/30'
                : 'bg-surface-container-low border-outline-variant/10'
            }`}
          >
            <div className="relative flex h-3 w-3">
              {!connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  connected ? 'bg-secondary' : 'bg-secondary'
                }`}
              />
            </div>
            <span className="font-headline font-bold text-xs tracking-widest text-secondary uppercase">
              {provisioning
                ? 'Preparing…'
                : connected
                  ? 'Agent connected'
                  : 'Waiting for agent (first metrics)…'}
            </span>
          </div>
          {connected && (
            <button
              type="button"
              onClick={() => router.push('/onboarding/step-4')}
              className="text-primary font-headline font-bold text-sm uppercase border-b border-primary/30 hover:border-primary"
            >
              Continue to launch →
            </button>
          )}
        </div>

        <div className="mt-12 flex items-center justify-between w-full">
          <button type="button" onClick={() => router.back()} className="text-outline text-xs font-headline font-bold uppercase tracking-widest flex items-center gap-2 hover:text-on-surface transition-colors">
            ← Previous Step
          </button>
          <button type="button" onClick={() => router.push('/onboarding/step-4')} className="text-secondary font-headline font-bold text-xs uppercase border-b border-secondary/20 hover:border-secondary transition-colors">
            Skip for now →
          </button>
        </div>
      </main>
    </div>
  );
}
