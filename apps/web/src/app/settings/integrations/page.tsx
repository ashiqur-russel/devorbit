'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type IntegrationRow = {
  _id?: string;
  provider: string;
  meta?: Record<string, string>;
  updatedAt?: string;
  createdAt?: string;
};

const PROVIDERS = [
  {
    id: 'GITHUB',
    name: 'GitHub',
    icon: '⬡',
    description: 'Ingest Actions workflow runs into Pipelines for projects linked to a repo.',
    tokenLabel: 'Personal access token',
    tokenPlaceholder: 'ghp_xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Fine-grained or classic PAT: include Actions (read) and Contents (metadata) at minimum.',
    docsHref: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens',
  },
  {
    id: 'GITLAB',
    name: 'GitLab',
    icon: '◈',
    description: 'Sync pipeline runs from GitLab.com or self-managed into your workspace.',
    tokenLabel: 'Personal access token',
    tokenPlaceholder: 'glpat-xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Scope: read_api (and read_repository if you use private projects).',
    docsHref: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  },
  {
    id: 'VERCEL',
    name: 'Vercel',
    icon: '▲',
    description: 'Pull deployment status and production URLs into Deployments.',
    tokenLabel: 'Vercel token',
    tokenPlaceholder: 'vercel_xxxxxxxxxxxxxxxxxxxx',
    tokenHelp: 'Create under Vercel → Account Settings → Tokens.',
    docsHref: 'https://vercel.com/docs/rest-api#authentication',
  },
] as const;

function formatRelative(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function IntegrationsSettingsPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [byProvider, setByProvider] = useState<Record<string, IntegrationRow>>({});
  const [listLoading, setListLoading] = useState(true);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [banner, setBanner] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  const loadList = useCallback(async () => {
    if (!teamId) {
      setByProvider({});
      setListLoading(false);
      return;
    }
    setListLoading(true);
    try {
      const list = await api.integrations.list(teamId);
      const map: Record<string, IntegrationRow> = {};
      (Array.isArray(list) ? list : []).forEach((i: IntegrationRow) => {
        if (i?.provider) map[i.provider] = i;
      });
      setByProvider(map);
    } catch {
      setByProvider({});
    } finally {
      setListLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const connectedCount = useMemo(() => Object.keys(byProvider).length, [byProvider]);

  const handleConnect = async (provider: string) => {
    const token = tokens[provider]?.trim();
    if (!token || !teamId) return;
    setSaving((s) => ({ ...s, [provider]: true }));
    setBanner(null);
    try {
      await api.integrations.connect(teamId, provider, token);
      setTokens((t) => ({ ...t, [provider]: '' }));
      setReplacing((r) => ({ ...r, [provider]: false }));
      setBanner({ type: 'ok', text: `${provider} saved. Sync jobs will pick this up on the next run.` });
      await loadList();
    } catch {
      setBanner({ type: 'error', text: 'Could not save this integration. Check the token and try again.' });
    } finally {
      setSaving((s) => ({ ...s, [provider]: false }));
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!teamId) return;
    setBanner(null);
    try {
      await api.integrations.disconnect(teamId, provider);
      setReplacing((r) => ({ ...r, [provider]: false }));
      setBanner({ type: 'ok', text: `${provider} disconnected.` });
      await loadList();
    } catch {
      setBanner({ type: 'error', text: 'Could not disconnect. Try again.' });
    }
  };

  return (
    <div className="relative space-y-10 pb-8">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 15%, rgba(208,188,255,0.35), transparent 42%), radial-gradient(circle at 80% 70%, rgba(76,215,246,0.2), transparent 45%)',
        }}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline transition-colors hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">Integrations</h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Tokens are stored for your team and used by background sync (GitHub Actions, GitLab CI, Vercel). Your Devorbit
            login can still use GitHub OAuth—that is separate from these API tokens.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Team scope</span>
          <span className="font-mono text-xs text-on-surface">{teamId || '—'}</span>
          <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase text-outline">
            {listLoading ? '…' : `${connectedCount} connected`}
          </span>
        </div>
      </div>

      {!teamLoading && !teamId && (
        <div className="rounded-xl border border-error/25 bg-error/5 px-5 py-4 text-sm text-error">
          No team found.{' '}
          <Link href="/onboarding/step-1" className="font-bold underline">
            Complete onboarding
          </Link>{' '}
          first.
        </div>
      )}

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            banner.type === 'error'
              ? 'border-error/30 bg-error/5 text-error'
              : 'border-tertiary/30 bg-tertiary/5 text-tertiary'
          }`}
        >
          {banner.text}
        </div>
      )}

      {teamId && listLoading && (
        <p className="text-sm text-outline">Loading integration status…</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {PROVIDERS.map((p) => {
          const row = byProvider[p.id];
          const isConnected = Boolean(row);
          const showForm = !isConnected || replacing[p.id];
          const metaHint = row?.meta?.accountLogin || row?.meta?.username;

          return (
            <article
              key={p.id}
              className={`relative overflow-hidden rounded-2xl border bg-surface-container-low p-5 sm:p-6 ${
                p.id === 'VERCEL' ? 'lg:col-span-2' : ''
              } ${
                isConnected && !replacing[p.id]
                  ? 'border-tertiary/25 shadow-[inset_0_0_0_1px_rgba(78,222,163,0.08)]'
                  : 'border-outline-variant/10'
              }`}
            >
              <div className="absolute -right-8 -top-12 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="mt-0.5 text-2xl text-primary">{p.icon}</span>
                  <div className="min-w-0">
                    <h2 className="font-headline text-lg font-bold text-on-surface">{p.name}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{p.description}</p>
                    {isConnected && !replacing[p.id] && (
                      <p className="mt-2 text-[11px] text-outline">
                        Credential on file · updated {formatRelative(row?.updatedAt)}{' '}
                        {metaHint ? (
                          <>
                            · <span className="text-on-surface-variant">{metaHint}</span>
                          </>
                        ) : null}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {isConnected && !replacing[p.id] ? (
                    <>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-tertiary/30 bg-tertiary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary">
                        <span className="h-1.5 w-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                        Connected
                      </span>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setReplacing((r) => ({ ...r, [p.id]: true }))}
                          className="text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                        >
                          Replace token
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDisconnect(p.id)}
                          className="text-xs font-bold uppercase tracking-wider text-error hover:underline"
                        >
                          Disconnect
                        </button>
                      </div>
                    </>
                  ) : (
                    <a
                      href={p.docsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold uppercase tracking-wider text-secondary hover:underline"
                    >
                      Token docs ↗
                    </a>
                  )}
                </div>
              </div>

              {showForm && (
                <div className="relative mt-5 space-y-3 border-t border-outline-variant/10 pt-5">
                  {isConnected && replacing[p.id] && (
                    <button
                      type="button"
                      onClick={() => setReplacing((r) => ({ ...r, [p.id]: false }))}
                      className="text-xs text-outline hover:text-on-surface"
                    >
                      ← Cancel replace
                    </button>
                  )}
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {p.tokenLabel}
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={tokens[p.id] || ''}
                    onChange={(e) => setTokens((t) => ({ ...t, [p.id]: e.target.value }))}
                    placeholder={p.tokenPlaceholder}
                    className="w-full rounded-xl border border-outline-variant/20 bg-surface-container px-4 py-2.5 font-mono text-sm text-on-surface placeholder:text-outline focus:border-primary/50 focus:outline-none"
                  />
                  <p className="text-[11px] leading-relaxed text-outline">{p.tokenHelp}</p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => handleConnect(p.id)}
                      disabled={saving[p.id] || !tokens[p.id]?.trim() || !teamId}
                      className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary font-headline shadow-[0_0_14px_rgba(208,188,255,0.25)] transition-all hover:shadow-[0_0_22px_rgba(208,188,255,0.4)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {saving[p.id] ? 'Saving…' : isConnected ? `Save new ${p.name} token` : `Connect ${p.name}`}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-outline">
        Tip: serve the app over HTTPS in production so tokens are not sent in clear text. Until TLS is on, avoid entering
        production secrets from untrusted networks.
      </p>
    </div>
  );
}
