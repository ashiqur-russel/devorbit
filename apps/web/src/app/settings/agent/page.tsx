'use client';

import { useMemo, useState } from 'react';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getAgentInstallCommand } from '@/lib/agent-install-command';

export default function AgentSetupPage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const rawToken =
    typeof window !== 'undefined' ? localStorage.getItem('devorbit_token') || '' : '';

  const { full, display } = useMemo(() => getAgentInstallCommand(rawToken), [rawToken]);

  const handleCopy = async () => {
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
    <div className="space-y-8 max-w-3xl">
      <div>
        <span className="text-xs font-bold uppercase tracking-widest text-outline font-headline block mb-1">Configuration Panel</span>
        <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">Agent Setup</h1>
        <p className="text-on-surface-variant text-sm mt-2 max-w-lg">
          Connect your local hardware or cloud infrastructure to DevOrbit. Deploying the lightweight agent enables real-time node orchestration and metrics piping.
        </p>
      </div>

      {/* Terminal snippet */}
      <div className="rounded-xl overflow-hidden border border-outline-variant/10 shadow-2xl">
        <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-error/40" />
            <div className="w-3 h-3 rounded-full bg-secondary/40" />
            <div className="w-3 h-3 rounded-full bg-tertiary/40" />
          </div>
          <span className="text-xs font-mono text-outline uppercase tracking-widest">devorbit-terminal — bash</span>
          <div className="w-12" />
        </div>
        <div className="bg-surface-container-lowest p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <code className="font-mono text-sm text-on-surface break-all min-w-0">
            <span className="text-secondary">$</span> {display}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex items-center justify-center gap-2 bg-primary text-on-primary-container px-4 py-2 rounded-xl text-xs font-bold font-headline uppercase tracking-wider hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all"
          >
            {copied ? '✓ Copied' : '⧉ Copy'}
          </button>
        </div>
        {copyError && (
          <p className="px-6 pb-4 text-xs text-error font-mono">
            Copy failed on HTTP — select the command and copy manually, or enable HTTPS.
          </p>
        )}
      </div>

      {/* Installation guide */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">Installation Guide</h2>
        {[
          { n: '01', text: 'Ensure Node.js 18+ and npm are installed on the target server (npx comes with npm).' },
          { n: '02', text: 'Paste the command and run it; npm will fetch the devorbit-agent package from the public registry.' },
          { n: '03', text: 'The agent connects to your DevOrbit API (--api) over the network; the server must reach that URL.' },
        ].map((step) => (
          <div key={step.n} className="flex items-start gap-4">
            <span className="text-xs font-mono text-secondary font-bold shrink-0">{step.n}</span>
            <p className="text-sm text-on-surface-variant">{step.text}</p>
          </div>
        ))}
      </div>

      {/* Connection status */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
        <h2 className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface mb-4">Connection Status</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-outline opacity-50" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-outline" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-outline font-headline">Waiting for signal...</span>
        </div>
        <p className="text-xs text-outline mt-3">Awaiting inbound handshake from agent</p>

        <div className="mt-4 pt-4 border-t border-outline-variant/10 grid grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-outline uppercase">Encryption</span>
            <span className="text-secondary">AES-256-GCM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-outline uppercase">Latency Target</span>
            <span className="text-on-surface">&lt; 40ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
