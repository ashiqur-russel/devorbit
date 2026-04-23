'use client';

import { useMemo, useState } from 'react';
import { copyTextToClipboard } from '@/lib/clipboard';
import { getAgentInstallCommand } from '@/lib/agent-install-command';
import { useAgentInstallBootstrap } from '@/hooks/use-agent-install-bootstrap';

export default function AgentSetupPage() {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const { agentToken, provisioning, error, connected } = useAgentInstallBootstrap();

  const { full, display } = useMemo(() => getAgentInstallCommand(agentToken), [agentToken]);

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

      {error && <p className="text-sm text-error font-mono">{error}</p>}

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
            <span className="text-secondary">$</span>{' '}
            {provisioning ? '… preparing …' : display}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            disabled={provisioning || !agentToken}
            className="shrink-0 flex items-center justify-center gap-2 bg-primary text-on-primary-container px-4 py-2 rounded-xl text-xs font-bold font-headline uppercase tracking-wider hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all disabled:opacity-40"
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
          { n: '02', text: 'The command uses your server agent token (dev_…), not your login JWT.' },
          { n: '03', text: 'The command uses --background so SSH returns immediately; stop with the kill PID line printed by the agent.' },
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
            {!connected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-outline opacity-50" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                connected ? 'bg-secondary' : 'bg-outline'
              }`}
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-outline font-headline">
            {provisioning ? 'Preparing…' : connected ? 'Agent online' : 'Waiting for first metrics…'}
          </span>
        </div>
        <p className="text-xs text-outline mt-3">
          {connected ? 'Agent is sending metrics to DevOrbit.' : 'Awaiting inbound handshake from agent'}
        </p>

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

      <div className="max-w-3xl space-y-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
        <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
          Remove agent from this server
        </h2>
        <p className="text-sm text-on-surface-variant">
          The install command does not register a system package or systemd unit by default—it starts a Node process. To
          uninstall, stop that process and optionally revoke access in Devorbit.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-on-surface-variant">
          <li>
            <strong className="text-on-surface">Stop the agent.</strong> If you used{' '}
            <code className="rounded bg-surface-container-highest px-1 font-mono text-xs">--background</code>, the command
            printed a line like <code className="font-mono text-xs text-secondary">Stop with: kill &lt;pid&gt;</code>.
            Run that, or find the PID with{' '}
            <code className="rounded bg-surface-container-highest px-1 font-mono text-xs">pgrep -af devorbit-agent</code>{' '}
            / <code className="rounded bg-surface-container-highest px-1 font-mono text-xs">ps aux | grep devorbit</code>{' '}
            and <code className="font-mono text-xs">kill &lt;pid&gt;</code>.
          </li>
          <li>
            <strong className="text-on-surface">If you wrapped it in systemd, cron, or Docker,</strong> remove that unit,
            job, or container instead of only killing one-off processes.
          </li>
          <li>
            <strong className="text-on-surface">Treat the token as host-specific.</strong> After you stop the process,
            metrics stop. For a replacement machine, register a new server in Devorbit and use its new{' '}
            <code className="rounded bg-surface-container-highest px-1 font-mono text-xs">dev_…</code> token—do not reuse
            the old token elsewhere so a stray copy of the agent cannot reconnect.
          </li>
          <li>
            <strong className="text-on-surface">Optional:</strong> clear the npx download cache if you want the package
            gone from disk (
            <code className="rounded bg-surface-container-highest px-1 font-mono text-xs">~/.npm/_npx</code> on many
            systems)—not required for the agent to stay off.
          </li>
        </ol>
      </div>
    </div>
  );
}
