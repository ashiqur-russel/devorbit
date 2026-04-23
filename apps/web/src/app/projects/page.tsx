'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { ListAggregates, PaginationMeta } from '@devorbit/types';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';
import { Modal } from '@/components/ui/Modal';
import { ListPagination } from '@/components/ui/list-pagination';

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

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deployToken, setDeployToken] = useState<string | null>(null);
  const [deployTokenLoading, setDeployTokenLoading] = useState(false);

  const [active, setActive] = useState<ProjectRow | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    repoProvider: 'GITHUB' | 'GITLAB';
    repoOwner: string;
    repoName: string;
    vercelProjectId: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [listMeta, setListMeta] = useState<PaginationMeta | null>(null);
  const [listAggregates, setListAggregates] = useState<ListAggregates | null>(null);
  const [listTick, setListTick] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [teamId]);

  useEffect(() => {
    if (!teamId) {
      setProjects([]);
      setListMeta(null);
      setListAggregates(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.projects.byTeam(teamId, { page, limit: PAGE_SIZE, summary: true });
        if (cancelled) return;
        setProjects(Array.isArray(res.data) ? (res.data as ProjectRow[]) : []);
        setListMeta(res.meta);
        setListAggregates(res.aggregates ?? null);
        if (res.meta.page !== page) setPage(res.meta.page);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load projects');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId, page, listTick]);

  const openDetails = (p: ProjectRow) => {
    setError(null);
    setDeployToken(null);
    setActive(p);
    setDraft({
      name: p.name || '',
      repoProvider: ((p.repoProvider || 'GITHUB').toUpperCase() === 'GITLAB' ? 'GITLAB' : 'GITHUB') as
        | 'GITHUB'
        | 'GITLAB',
      repoOwner: p.repoOwner || '',
      repoName: p.repoName || '',
      vercelProjectId: p.vercelProjectId || '',
    });
  };

  const closeDetails = () => {
    if (savingId || deletingId) return;
    setActive(null);
    setDraft(null);
    setDeployToken(null);
  };

  const saveDetails = async () => {
    if (!active || !draft) return;
    setSavingId(active._id);
    setError(null);
    try {
      const updated = await api.projects.update(active._id, {
        name: draft.name.trim() || undefined,
        repoProvider: draft.repoProvider,
        repoOwner: draft.repoOwner.trim() || undefined,
        repoName: draft.repoName.trim() || undefined,
        vercelProjectId: draft.vercelProjectId.trim() || undefined,
      });
      setProjects((prev) => prev.map((x) => (x._id === active._id ? { ...x, ...updated } : x)));
      setActive((p) => (p && p._id === active._id ? { ...p, ...updated } : p));
      setListTick((t) => t + 1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update project');
    } finally {
      setSavingId(null);
    }
  };

  const archiveProject = async () => {
    if (!active) return;
    if (!confirm(`Archive "${active.name || active._id}"? You can re-create it later; data is preserved.`)) return;
    setDeletingId(active._id);
    setError(null);
    try {
      await api.projects.remove(active._id, false);
      setProjects((prev) => prev.filter((x) => x._id !== active._id));
      setListTick((t) => t + 1);
      closeDetails();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to archive project');
    } finally {
      setDeletingId(null);
    }
  };

  const deleteCascadeProject = async () => {
    if (!active) return;
    const typed = prompt(
      `PERMANENT DELETE\n\nThis will delete the project AND all related pipeline runs & deployments.\n\nType the project name to confirm:`,
      '',
    );
    const expected = (active.name || '').trim();
    if (!expected || (typed || '').trim() !== expected) return;

    setDeletingId(active._id);
    setError(null);
    try {
      await api.projects.remove(active._id, true);
      setProjects((prev) => prev.filter((x) => x._id !== active._id));
      setListTick((t) => t + 1);
      closeDetails();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  const rotateDeployToken = async () => {
    if (!active) return;
    setDeployTokenLoading(true);
    setError(null);
    try {
      const res = await api.projects.rotateDeployToken(active._id);
      setDeployToken(res.token);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate deploy token');
    } finally {
      setDeployTokenLoading(false);
    }
  };

  const linkedCount = listAggregates?.projectSummary?.withRepo ?? 0;

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
            { label: 'Total', value: listMeta?.total ?? 0, accent: 'text-on-surface' },
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
            {loading ? '…' : `${listMeta?.total ?? 0} total`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-outline">Loading…</div>
        ) : !teamId ? null : projects.length === 0 && (listMeta?.total ?? 0) === 0 ? (
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
          <>
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
                          onClick={() => openDetails(p)}
                          disabled={savingId === p._id || deletingId === p._id}
                          className="text-xs font-bold uppercase tracking-wider text-secondary hover:underline disabled:opacity-50"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => openDetails(p)}
                          disabled={deletingId === p._id || savingId === p._id}
                          className="text-xs font-bold uppercase tracking-wider text-outline hover:text-on-surface hover:underline disabled:opacity-50"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPagination page={page} pageSize={PAGE_SIZE} total={listMeta?.total ?? 0} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(active && draft)}
        title={active?.name || 'Project'}
        subtitle={active ? `Project ID: ${active._id}` : undefined}
        onClose={closeDetails}
        footer={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={archiveProject}
                disabled={!active || Boolean(deletingId) || Boolean(savingId)}
                className="rounded-xl bg-surface-container-highest px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-bright disabled:opacity-50"
              >
                {deletingId ? 'Working…' : 'Archive'}
              </button>
              <button
                type="button"
                onClick={deleteCascadeProject}
                disabled={!active || Boolean(deletingId) || Boolean(savingId)}
                className="rounded-xl border border-error/30 bg-error/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-error transition-colors hover:bg-error/15 disabled:opacity-50"
              >
                Permanent delete
              </button>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={closeDetails}
                disabled={Boolean(deletingId) || Boolean(savingId)}
                className="rounded-xl border border-outline-variant/15 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDetails}
                disabled={!active || !draft || Boolean(savingId) || Boolean(deletingId)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
              >
                {savingId ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        }
      >
        {active && draft ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-outline">Project name</label>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
                  placeholder="portfolio"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo provider</label>
                <select
                  value={draft.repoProvider}
                  onChange={(e) =>
                    setDraft((d) => (d ? { ...d, repoProvider: e.target.value as 'GITHUB' | 'GITLAB' } : d))
                  }
                  className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
                >
                  <option value="GITHUB">GitHub</option>
                  <option value="GITLAB">GitLab</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo owner</label>
                <input
                  value={draft.repoOwner}
                  onChange={(e) => setDraft((d) => (d ? { ...d, repoOwner: e.target.value } : d))}
                  className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
                  placeholder="ashiqur-russel"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo name</label>
                <input
                  value={draft.repoName}
                  onChange={(e) => setDraft((d) => (d ? { ...d, repoName: e.target.value } : d))}
                  className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm text-on-surface"
                  placeholder="portfolio"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-outline">Vercel project id</label>
                <input
                  value={draft.vercelProjectId}
                  onChange={(e) => setDraft((d) => (d ? { ...d, vercelProjectId: e.target.value } : d))}
                  className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 font-mono text-xs text-on-surface"
                  placeholder="prj_..."
                />
                <p className="mt-2 text-[11px] text-on-surface-variant">
                  This powers <span className="text-on-surface">Deployments</span> via the Vercel integration. Pipelines
                  still come from GitHub Actions / GitLab CI.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-outline">VPS deployments (OVH / any server)</p>
              <p className="mt-2 text-[11px] text-on-surface-variant">
                Generate a deploy token and add it to your CI so Devorbit can record VPS deployments in the Deployments
                page.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={rotateDeployToken}
                  disabled={!active || deployTokenLoading || Boolean(savingId) || Boolean(deletingId)}
                  className="rounded-xl bg-surface-container-highest px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-surface transition-colors hover:bg-surface-bright disabled:opacity-50"
                >
                  {deployTokenLoading ? 'Generating…' : deployToken ? 'Rotate token' : 'Generate token'}
                </button>
                {deployToken ? (
                  <span className="rounded-lg border border-outline-variant/15 bg-surface-container-high px-3 py-2 font-mono text-[11px] text-on-surface">
                    {deployToken}
                  </span>
                ) : (
                  <span className="text-[11px] text-outline">Token is shown once after generation.</span>
                )}
              </div>
              {active ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline">GitHub Secret: DEVORBIT_PROJECT_ID</p>
                    <p className="mt-1 font-mono text-[11px] text-on-surface">{active._id}</p>
                  </div>
                  <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-outline">GitHub Secret: DEVORBIT_DEPLOY_TOKEN</p>
                    <p className="mt-1 text-[11px] text-on-surface-variant">Use the generated token above.</p>
                  </div>
                </div>
              ) : null}
            </div>

            {draft.repoOwner && draft.repoName ? (
              <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Linked repo</p>
                <p className="mt-2 font-mono text-xs text-on-surface">
                  {(draft.repoProvider === 'GITLAB' ? 'gitlab.com' : 'github.com') + '/' + draft.repoOwner + '/' + draft.repoName}
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

