'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { PaginationMeta } from '@devorbit/types';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';
import { ListPagination } from '@/components/ui/list-pagination';

type PopulatedProject = {
  _id?: string;
  name?: string;
  repoOwner?: string;
  repoName?: string;
};

type PopulatedServer = { _id?: string; name?: string };

type DeploymentRow = {
  _id: string;
  platform?: string;
  status?: string;
  url?: string;
  deployedAt?: string;
  projectId?: string | PopulatedProject;
  serverId?: string | PopulatedServer | null;
};

const platformIcon: Record<string, string> = {
  VERCEL: '▲',
  OVH: '⬡',
  AWS: '☁',
  DIGITALOCEAN: '◎',
  CUSTOM: '⬡',
};

const statusColor: Record<string, string> = {
  success: 'text-tertiary',
  failure: 'text-error',
  building: 'text-secondary',
  cancelled: 'text-outline',
};

const statusDot: Record<string, string> = {
  success: 'bg-tertiary',
  failure: 'bg-error',
  building: 'bg-secondary',
  cancelled: 'bg-outline',
};

function pickDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') return new Date(v);
  if (typeof v === 'object' && v !== null && '$date' in v) {
    return new Date((v as { $date: string }).$date);
  }
  return null;
}

function formatRelative(iso?: string | Date | null) {
  const d =
    typeof iso === 'string' ? new Date(iso) : iso instanceof Date ? iso : pickDate(iso as unknown);
  if (!d || Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function projectOf(row: DeploymentRow): PopulatedProject | null {
  const p = row.projectId;
  if (p && typeof p === 'object') return p as PopulatedProject;
  return null;
}

function projectLabel(row: DeploymentRow) {
  return projectOf(row)?.name || 'Project';
}

function serverLabel(row: DeploymentRow) {
  const s = row.serverId;
  if (s && typeof s === 'object') return (s as PopulatedServer).name || 'Server';
  return '—';
}

const PAGE_SIZE = 10;

export default function DeploymentsPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);
  const [projects, setProjects] = useState<{ _id: string; name?: string }[]>([]);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta | null>(null);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      setProjects([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const projRows = await api.projects.byTeam(teamId);
        if (!cancelled) {
          setProjects(Array.isArray(projRows) ? projRows.map((p: { _id?: string; name?: string }) => ({ _id: String(p._id), name: p.name })) : []);
        }
      } catch {
        if (!cancelled) setProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      setDeployments([]);
      setListMeta(null);
      setStatusCounts({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await api.deployments.recentByTeam(teamId, {
          page,
          limit: PAGE_SIZE,
          projectId: projectFilter === 'all' ? undefined : projectFilter,
          statusCounts: true,
        });
        if (cancelled) return;
        setDeployments(Array.isArray(res.data) ? (res.data as DeploymentRow[]) : []);
        setListMeta(res.meta);
        setStatusCounts(res.aggregates?.statusCounts ?? {});
        if (res.meta.page !== page) setPage(res.meta.page);
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load');
          setDeployments([]);
          setListMeta(null);
          setStatusCounts({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, page, projectFilter]);

  const stats = useMemo(() => {
    const c = statusCounts;
    const total = listMeta?.total ?? 0;
    return {
      total,
      success: c.success ?? 0,
      failure: c.failure ?? 0,
      building: c.building ?? 0,
    };
  }, [statusCounts, listMeta]);

  return (
    <div className="space-y-10">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 22%, rgba(78,222,163,0.28), transparent 40%), radial-gradient(circle at 82% 8%, rgba(208,188,255,0.24), transparent 36%)',
        }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline transition-colors hover:text-primary"
          >
            ← Dashboard
          </Link>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">Deployments</h1>
          <p className="max-w-xl text-sm text-on-surface-variant">
            Releases and targets tied to your team&apos;s projects—servers, Vercel, and other platforms as you connect
            them.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/projects/new"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary font-headline transition-all hover:shadow-[0_0_18px_rgba(208,188,255,0.35)]"
          >
            + New project
          </Link>
          <Link
            href="/settings/integrations"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-surface-container-highest px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface font-headline transition-colors hover:bg-surface-bright"
          >
            Integrations
          </Link>
        </div>
      </div>

      {!teamLoading && !teamId && (
        <p className="text-sm text-on-surface-variant">
          No team yet. Finish{' '}
          <Link href="/onboarding/step-1" className="text-primary underline">
            onboarding
          </Link>{' '}
          to track deployments.
        </p>
      )}

      {loadError && (
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{loadError}</div>
      )}

      {teamId && !loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total', value: stats.total, accent: 'text-on-surface' },
            { label: 'Live', value: stats.success, accent: 'text-tertiary' },
            { label: 'Failed', value: stats.failure, accent: 'text-error' },
            { label: 'Building', value: stats.building, accent: 'text-secondary' },
          ].map((c) => (
            <div
              key={c.label}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5"
            >
              <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-tertiary/10 blur-2xl" />
              <p className="relative text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                {c.label}
              </p>
              <p className={`relative mt-2 font-headline text-3xl font-black tracking-tighter ${c.accent}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {teamId && projects.length > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="dep-project" className="text-xs font-bold uppercase tracking-widest text-outline">
            Project
          </label>
          <select
            id="dep-project"
            value={projectFilter}
            onChange={(e) => {
              setProjectFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-sm text-on-surface"
          >
            <option value="all">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name || p._id}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/10 px-6 py-4">
          <span className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">Deployments</span>
          <span className="rounded-lg bg-surface-container-highest px-2 py-1 font-mono text-xs text-outline">
            {loading ? '…' : `${listMeta?.total ?? 0} in view`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-outline">Loading…</div>
        ) : !teamId ? null : deployments.length === 0 && (listMeta?.total ?? 0) === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-2xl">
              ↑
            </div>
            <h3 className="mb-2 font-headline text-lg font-bold text-on-surface">No deployments in this view</h3>
            <p className="mx-auto max-w-md text-sm text-on-surface-variant">
              Connect Vercel, register servers, or push through your agent so deployment rows populate from the API.
            </p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-outline-variant/10">
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-outline">
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Target</th>
                  <th className="px-6 py-3">Platform</th>
                  <th className="px-6 py-3">URL</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Deployed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {deployments.map((dep) => {
                  const st = dep.status || 'building';
                  return (
                    <tr key={dep._id} className="transition-colors hover:bg-white/[0.04]">
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">{projectLabel(dep)}</td>
                      <td className="px-6 py-4 text-xs text-on-surface-variant">{serverLabel(dep)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary">{platformIcon[dep.platform || ''] || '⬡'}</span>
                          <span className="font-headline text-sm font-bold text-on-surface">{dep.platform || '—'}</span>
                        </div>
                      </td>
                      <td className="max-w-xs px-6 py-4">
                        {dep.url ? (
                          <a
                            href={dep.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate font-mono text-xs text-secondary hover:underline"
                          >
                            {dep.url}
                          </a>
                        ) : (
                          <span className="font-mono text-xs text-outline">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${statusDot[st] || 'bg-outline'} ${st === 'building' ? 'animate-pulse' : ''}`}
                          />
                          <span className={`text-xs font-bold uppercase tracking-wider ${statusColor[st] || 'text-outline'}`}>
                            {st}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-outline">{formatRelative(dep.deployedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ListPagination page={page} pageSize={PAGE_SIZE} total={listMeta?.total ?? 0} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
