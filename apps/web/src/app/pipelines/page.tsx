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
  repoProvider?: string;
};

type PipelineRunRow = {
  _id: string;
  runId?: string;
  branch?: string;
  workflowName?: string;
  status?: string;
  duration?: number;
  provider?: string;
  createdAt?: string;
  projectId?: string | PopulatedProject;
};

const statusColor: Record<string, string> = {
  success: 'text-tertiary',
  failure: 'text-error',
  running: 'text-secondary',
  cancelled: 'text-outline',
  pending: 'text-outline',
};

const statusDot: Record<string, string> = {
  success: 'bg-tertiary',
  failure: 'bg-error',
  running: 'bg-secondary',
  cancelled: 'bg-outline',
  pending: 'bg-outline',
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
  const d = typeof iso === 'string' ? new Date(iso) : iso instanceof Date ? iso : pickDate(iso);
  if (!d || Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function formatDuration(seconds: number) {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function projectOf(row: PipelineRunRow): PopulatedProject | null {
  const p = row.projectId;
  if (p && typeof p === 'object') return p as PopulatedProject;
  return null;
}

function projectLabel(row: PipelineRunRow) {
  return projectOf(row)?.name || 'Project';
}

function externalRunUrl(row: PipelineRunRow): string | null {
  const runId = row.runId;
  if (!runId) return null;
  const p = projectOf(row);
  if (!p?.repoOwner || !p?.repoName) return null;
  if (p.repoProvider === 'GITLAB') {
    return `https://gitlab.com/${p.repoOwner}/${p.repoName}/-/pipelines/${runId}`;
  }
  return `https://github.com/${p.repoOwner}/${p.repoName}/actions/runs/${runId}`;
}

const PAGE_SIZE = 10;

export default function PipelinesPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [runs, setRuns] = useState<PipelineRunRow[]>([]);
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
        const projRes = await api.projects.byTeam(teamId, { page: 1, limit: 200 });
        if (!cancelled) {
          const projRows = (Array.isArray(projRes.data) ? projRes.data : []) as { _id?: string; name?: string }[];
          setProjects(projRows.map((p) => ({ _id: String(p._id), name: p.name })));
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
      setRuns([]);
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
        const res = await api.pipelines.recentByTeam(teamId, {
          page,
          limit: PAGE_SIZE,
          projectId: projectFilter === 'all' ? undefined : projectFilter,
          statusCounts: true,
        });
        if (cancelled) return;
        setRuns(Array.isArray(res.data) ? (res.data as PipelineRunRow[]) : []);
        setListMeta(res.meta);
        setStatusCounts(res.aggregates?.statusCounts ?? {});
        if (res.meta.page !== page) setPage(res.meta.page);
      } catch (e: unknown) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load');
          setRuns([]);
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
      active: (c.running ?? 0) + (c.pending ?? 0),
    };
  }, [statusCounts, listMeta]);

  return (
    <div className="space-y-10">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(76,215,246,0.35), transparent 42%), radial-gradient(circle at 88% 12%, rgba(208,188,255,0.22), transparent 38%)',
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
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">Pipelines</h1>
          <p className="max-w-xl text-sm text-on-surface-variant">
            CI runs scoped to your team&apos;s projects. Connect GitHub or GitLab under Settings to ingest workflows.
          </p>
        </div>
        <Link
          href="/projects/new?provider=GITHUB"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary font-headline transition-all hover:shadow-[0_0_18px_rgba(208,188,255,0.35)]"
        >
          + New project (link repo)
        </Link>
      </div>

      {!teamLoading && !teamId && (
        <p className="text-sm text-on-surface-variant">
          No team yet. Finish{' '}
          <Link href="/onboarding/step-1" className="text-primary underline">
            onboarding
          </Link>{' '}
          to see pipeline data.
        </p>
      )}

      {loadError && (
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{loadError}</div>
      )}

      {teamId && !loading && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total runs', value: stats.total, accent: 'text-on-surface' },
            { label: 'Succeeded', value: stats.success, accent: 'text-tertiary' },
            { label: 'Failed', value: stats.failure, accent: 'text-error' },
            { label: 'Active / queued', value: stats.active, accent: 'text-secondary' },
          ].map((c) => (
            <div
              key={c.label}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5"
            >
              <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
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
          <label htmlFor="pipe-project" className="text-xs font-bold uppercase tracking-widest text-outline">
            Project
          </label>
          <select
            id="pipe-project"
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
          <span className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">Pipeline runs</span>
          <span className="rounded-lg bg-surface-container-highest px-2 py-1 font-mono text-xs text-outline">
            {loading ? '…' : `${listMeta?.total ?? 0} in view`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-outline">Loading…</div>
        ) : !teamId ? null : runs.length === 0 && (listMeta?.total ?? 0) === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-on-surface-variant text-sm">No pipeline runs for this view yet.</p>
            <p className="mt-2 text-xs text-outline">
              After integrations sync, runs appear here with links to GitHub Actions or GitLab pipelines when a repo is
              linked on the project.
            </p>
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-outline-variant/10">
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-outline">
                  <th className="px-6 py-3">Project</th>
                  <th className="px-6 py-3">Workflow</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Duration</th>
                  <th className="px-6 py-3 text-right">When</th>
                  <th className="px-6 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {runs.map((run) => {
                  const ext = externalRunUrl(run);
                  const st = run.status || 'pending';
                  return (
                    <tr key={run._id} className="transition-colors hover:bg-white/[0.04]">
                      <td className="px-6 py-4 text-sm font-medium text-on-surface">{projectLabel(run)}</td>
                      <td className="max-w-[200px] truncate px-6 py-4 font-mono text-xs text-on-surface-variant">
                        {run.workflowName || run.runId || '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{run.branch || '—'}</td>
                      <td className="px-6 py-4 text-xs font-bold text-primary">{run.provider || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${statusDot[st] || 'bg-outline'} ${st === 'running' ? 'animate-pulse' : ''}`}
                          />
                          <span className={`text-xs font-bold uppercase tracking-wider ${statusColor[st] || 'text-outline'}`}>
                            {st}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-xs text-on-surface-variant">
                        {formatDuration(run.duration ?? 0)}
                      </td>
                      <td className="px-6 py-4 text-right text-xs text-outline">{formatRelative(run.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        {ext ? (
                          <a
                            href={ext}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline"
                          >
                            Open ↗
                          </a>
                        ) : (
                          <span className="text-xs text-outline">—</span>
                        )}
                      </td>
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
