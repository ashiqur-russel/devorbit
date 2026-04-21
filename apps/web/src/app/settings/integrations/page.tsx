'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const PROVIDERS = [
  {
    id: 'GITHUB',
    name: 'GitHub',
    icon: '⬡',
    description: 'Track Actions workflow runs across your repositories.',
    tokenLabel: 'Personal Access Token',
    tokenPlaceholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Needs repo and workflow read scopes.',
  },
  {
    id: 'GITLAB',
    name: 'GitLab',
    icon: '◈',
    description: 'Sync CI/CD pipeline runs from GitLab projects.',
    tokenLabel: 'Personal Access Token',
    tokenPlaceholder: 'glpat-xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Needs read_api scope.',
  },
  {
    id: 'VERCEL',
    name: 'Vercel',
    icon: '▲',
    description: 'Pull deployment status and URLs from Vercel.',
    tokenLabel: 'API Token',
    tokenPlaceholder: 'vercel_xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Create a token in Vercel account settings.',
  },
];

const TEAM_ID_KEY = 'devorbit_team_id';

export default function IntegrationsSettingsPage() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [teamId, setTeamId] = useState('');

  useEffect(() => {
    const tid = localStorage.getItem(TEAM_ID_KEY) || '';
    setTeamId(tid);
    if (!tid) return;
    api.integrations
      .list(tid)
      .then((list) => {
        const map: Record<string, boolean> = {};
        list.forEach((i: any) => (map[i.provider] = true));
        setConnected(map);
      })
      .catch(() => {});
  }, []);

  const handleConnect = async (provider: string) => {
    const token = tokens[provider]?.trim();
    if (!token || !teamId) return;
    setSaving((s) => ({ ...s, [provider]: true }));
    try {
      await api.integrations.connect(teamId, provider, token);
      setConnected((c) => ({ ...c, [provider]: true }));
      setTokens((t) => ({ ...t, [provider]: '' }));
    } catch {
      alert('Failed to save integration. Check your token and try again.');
    } finally {
      setSaving((s) => ({ ...s, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!teamId) return;
    try {
      await api.integrations.disconnect(teamId, provider);
      setConnected((c) => ({ ...c, [provider]: false }));
    } catch {
      alert('Failed to disconnect.');
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">
          Integrations
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Connect your platforms to start syncing data.
        </p>
      </div>

      {!teamId && (
        <div className="bg-error-container/20 border border-error/20 rounded-xl px-5 py-4 text-sm text-error">
          No team ID found. Complete onboarding first.
        </div>
      )}

      <div className="space-y-4">
        {PROVIDERS.map((p) => (
          <div
            key={p.id}
            className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl text-primary">{p.icon}</span>
                <div>
                  <h3 className="font-headline font-bold text-on-surface">{p.name}</h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">{p.description}</p>
                </div>
              </div>
              {connected[p.id] ? (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-tertiary" />
                    <span className="text-xs font-bold text-tertiary uppercase tracking-wider">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={() => handleDisconnect(p.id)}
                    className="text-xs text-error hover:underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : null}
            </div>

            {!connected[p.id] && (
              <div className="mt-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {p.tokenLabel}
                </label>
                <input
                  type="password"
                  value={tokens[p.id] || ''}
                  onChange={(e) => setTokens((t) => ({ ...t, [p.id]: e.target.value }))}
                  placeholder={p.tokenPlaceholder}
                  className="w-full bg-surface-container rounded-lg px-4 py-3 text-sm font-mono text-on-surface border border-outline-variant/20 focus:outline-none focus:border-primary/50 placeholder:text-outline"
                />
                <p className="text-xs text-outline">{p.tokenHelp}</p>
                <button
                  onClick={() => handleConnect(p.id)}
                  disabled={saving[p.id] || !tokens[p.id]?.trim()}
                  className="px-5 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-40 hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all"
                >
                  {saving[p.id] ? 'Saving…' : `Connect ${p.name}`}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
