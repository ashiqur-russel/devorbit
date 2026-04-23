'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type ProjectRow = {
  _id: string;
  name?: string;
  description?: string;
  repoOwner?: string;
  repoName?: string;
  repoProvider?: string;
  vercelProjectId?: string;
};

function repoLabel(p: ProjectRow) {
  if (!p.repoOwner || !p.repoName) return '—';
  const provider = (p.repoProvider || 'GITHUB').toUpperCase();
  const base = provider === 'GITLAB' ? 'gitlab.com' : 'github.com';
  return `${base}/${p.repoOwner}/${p.repoName}`;
}

export default function ProjectsPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) {
      setProjects([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await api.projects.byTeam(teamId);
        if (!cancelled) setProjects(Array.isArray(rows) ? (rows as ProjectRow[]) : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const deleteProject = async (p: ProjectRow) => {
    const choice = prompt(
      `Delete project "${p.name || p._id}"?\n\n` +
        `Type:\n` +
        `- ARCHIVE (recommended) to hide it (keeps pipelines/deployments)\n` +
        `- DELETE to permanently delete it and ALL related pipelines/deployments\n\n` +
        `Anything else cancels.`,
    )
      ?.trim()
      .toUpperCase();
    if (!choice) return;

    const cascade = choice === 'DELETE';
    if (choice !== 'ARCHIVE' && choice !== 'DELETE') return;
    setDeletingId(p._id);
    setError(null);
    try {
      await api.projects.remove(p._id, cascade);
      setProjects((prev) => prev.filter((x) => x._id !== p._id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const editProject = async (p: ProjectRow) => {
    const vercelProjectId = prompt('Vercel project id (leave blank to clear)', p.vercelProjectId || '') ?? '';
    const next = vercelProjectId.trim();

    setSavingId(p._id);
    setError(null);
    try {
      const updated = await api.projects.update(p._id, { vercelProjectId: next || undefined });
      setProjects((prev) => prev.map((x) => (x._id === p._id ? { ...x, ...updated } : x)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update project');
    } finally {
      setSavingId(null);
    }
  };

  const linkedCount = useMemo(() => projects.filter((p) => p.repoOwner && p.repoName).length, [projects]);

  return (
    <div className="space-y-10">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 15%, rgba(208,188,255,0.35), transparent 42%), radial-gradient(circle at 75% 70%, rgba(76,215,246,0.22), transparent 45%)',
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
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">Projects</h1>
          <p className="max-w-2xl text-sm text-on-surface-variant">
            Projects connect your team’s data sources: link a GitHub repo for pipeline runs, connect Vercel for
            deployments, and associate servers as needed.
          </p>
        </div>

        <Link
          href="/projects/new"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary font-headline transition-all hover:shadow-[0_0_18px_rgba(208,188,255,0.35)]"
        >
          + New project
        </Link>
      </div>

      {!teamLoading && !teamId && (
        <p className="text-sm text-on-surface-variant">
          No team yet. Finish{' '}
          <Link href="/onboarding/step-1" className="text-primary underline">
            onboarding
          </Link>{' '}
          first.
        </p>
      )}

      {error && <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>}

      {teamId && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { label: 'Total', value: projects.length, accent: 'text-on-surface' },
            { label: 'Repos linked', value: linkedCount, accent: 'text-secondary' },
            { label: 'Team scope', value: teamId, accent: 'text-outline', mono: true },
          ].map((c) => (
            <div
              key={c.label}
              className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5"
            >
              <div className="absolute -right-4 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
              <p className="relative text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-headline">
                {c.label}
              </p>
              <p
                className={`relative mt-2 ${c.mono ? 'font-mono text-sm' : 'font-headline text-3xl font-black tracking-tighter'} ${c.accent}`}
              >
                {loading ? '…' : c.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/10 px-6 py-4">
          <span className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">Your projects</span>
          <span className="rounded-lg bg-surface-container-highest px-2 py-1 font-mono text-xs text-outline">
            {loading ? '…' : `${projects.length} shown`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-outline">Loading…</div>
        ) : !teamId ? null : projects.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high text-2xl">
              ◎
            </div>
            <h3 className="mb-2 font-headline text-lg font-bold text-on-surface">No projects yet</h3>
            <p className="mx-auto max-w-md text-sm text-on-surface-variant">
              Create a project and link your repo (owner + name). After GitHub integration sync runs, pipeline runs will
              appear under Pipelines.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/projects/new"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary"
              >
                Create project
              </Link>
              <Link
                href="/settings/integrations"
                className="inline-flex items-center justify-center rounded-xl bg-surface-container-highest px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-surface"
              >
                Manage integrations
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-outline-variant/10">
                <tr className="text-left text-[10px] font-bold uppercase tracking-widest text-outline">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Repo</th>
                  <th className="px-6 py-3">Provider</th>
                  <th className="px-6 py-3">Vercel</th>
                  <th className="px-6 py-3 text-right"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {projects.map((p) => (
                  <tr key={p._id} className="transition-colors hover:bg-white/[0.04]">
                    <td className="px-6 py-4 text-sm font-medium text-on-surface">{p.name || 'Project'}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{repoLabel(p)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-primary">{(p.repoProvider || '—').toUpperCase()}</td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{p.vercelProjectId || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          onClick={() => editProject(p)}
                          disabled={savingId === p._id || deletingId === p._id}
                          className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline disabled:opacity-50"
                        >
                          {savingId === p._id ? 'Saving…' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(p)}
                          disabled={deletingId === p._id || savingId === p._id}
                          className="text-xs font-bold uppercase tracking-wider text-error hover:underline disabled:opacity-50"
                        >
                          {deletingId === p._id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

