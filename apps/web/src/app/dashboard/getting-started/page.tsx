'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTeamId } from '@/hooks/use-team-id';
import { api } from '@/lib/api';

type IntegrationRow = { provider?: string };
type ProjectRow = { _id: string; name?: string; repoOwner?: string; repoName?: string; vercelProjectId?: string };
type ServerRow = { _id: string };
type DeploymentRow = { _id: string; platform?: string; projectId?: string | { _id?: string } };
type PipelineRow = { _id: string };

function normProvider(v: unknown): string {
  return typeof v === 'string' ? v.trim().toUpperCase() : '';
}

function pickProjectId(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null && '_id' in v) {
    const id = (v as { _id?: unknown })._id;
    if (typeof id === 'string') return id;
  }
  return null;
}

function CheckItem({
  done,
  title,
  description,
  ctaLabel,
  ctaHref,
  secondaryHref,
  secondaryLabel,
}: {
  done: boolean;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                done ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-highest text-outline'
              }`}
            >
              {done ? '✓' : '•'}
            </span>
            <p className="truncate font-headline text-sm font-black tracking-tight text-on-surface">{title}</p>
            {done ? (
              <span className="rounded-lg bg-tertiary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-tertiary">
                Done
              </span>
            ) : (
              <span className="rounded-lg bg-secondary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                Next
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-on-surface-variant">{description}</p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <Link
            href={ctaHref}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest font-headline transition-colors ${
              done ? 'bg-surface-container-highest text-on-surface hover:bg-surface-bright' : 'bg-primary text-on-primary'
            }`}
          >
            {ctaLabel}
          </Link>
          {secondaryHref && secondaryLabel ? (
            <Link href={secondaryHref} className="text-xs font-bold uppercase tracking-widest text-outline hover:text-on-surface">
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function GettingStartedPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [integrations, setIntegrations] = useState<IntegrationRow[]>([]);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [pipelines, setPipelines] = useState<PipelineRow[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRow[]>([]);

  useEffect(() => {
    if (!teamId) {
      setIntegrations([]);
      setProjects([]);
      setServers([]);
      setPipelines([]);
      setDeployments([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [ints, projs, sv, pipes, deps] = await Promise.all([
          api.integrations.list(teamId),
          api.projects.byTeam(teamId),
          api.servers.byTeam(teamId),
          api.pipelines.recentByTeam(teamId, { page: 1, limit: 20 }),
          api.deployments.recentByTeam(teamId, { page: 1, limit: 50 }),
        ]);
        if (cancelled) return;
        setIntegrations(Array.isArray(ints) ? (ints as IntegrationRow[]) : []);
        setProjects(Array.isArray(projs) ? (projs as ProjectRow[]) : []);
        setServers(Array.isArray(sv) ? (sv as ServerRow[]) : []);
        setPipelines(Array.isArray(pipes.data) ? (pipes.data as PipelineRow[]) : []);
        setDeployments(Array.isArray(deps.data) ? (deps.data as DeploymentRow[]) : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const stats = useMemo(() => {
    const providers = new Set(integrations.map((x) => normProvider(x.provider)));
    const hasGitHub = providers.has('GITHUB');
    const hasVercel = providers.has('VERCEL');
    const hasProject = projects.length > 0;
    const projectWithRepo = projects.some((p) => Boolean(p.repoOwner && p.repoName));
    const projectWithVercel = projects.some((p) => Boolean(p.vercelProjectId));
    const hasServer = servers.length > 0;

    const hasAnyPipeline = pipelines.length > 0;

    const vpsPlatforms = new Set(['OVH', 'AWS', 'DIGITALOCEAN', 'CUSTOM']);
    const vpsDeploymentByProjectId = new Set(
      deployments
        .filter((d) => vpsPlatforms.has(normProvider(d.platform)))
        .map((d) => pickProjectId(d.projectId))
        .filter((x): x is string => Boolean(x)),
    );
    const hasAnyVpsDeployment = vpsDeploymentByProjectId.size > 0;

    const hasAnyDeployment = deployments.length > 0;

    return {
      hasGitHub,
      hasVercel,
      hasProject,
      projectWithRepo,
      projectWithVercel,
      hasServer,
      hasAnyPipeline,
      hasAnyDeployment,
      hasAnyVpsDeployment,
    };
  }, [integrations, projects, servers, pipelines, deployments]);

  const completion = useMemo(() => {
    const items = [
      stats.hasGitHub,
      stats.hasProject,
      stats.projectWithRepo,
      stats.hasAnyPipeline,
      stats.hasServer,
      stats.hasAnyDeployment || stats.hasVercel, // deployments can come later; showing progress is fine
    ];
    const done = items.filter(Boolean).length;
    return { done, total: items.length };
  }, [stats]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface">Getting Started</h1>
          <p className="text-sm text-on-surface-variant">
            A guided checklist to connect your CI, deployments, and servers. Complete these steps once per team.
          </p>
        </div>
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">Progress</p>
          <p className="mt-1 font-headline text-3xl font-black tracking-tighter text-on-surface">
            {loading ? '…' : `${completion.done}/${completion.total}`}
          </p>
          {teamId ? <p className="mt-1 font-mono text-[11px] text-outline">Team: {teamId}</p> : null}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{error}</div>
      ) : null}

      {!teamLoading && !teamId ? (
        <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
          <p className="text-sm text-on-surface-variant">
            No team selected yet. Finish{' '}
            <Link href="/onboarding/step-1" className="text-primary underline">
              onboarding
            </Link>{' '}
            first.
          </p>
        </div>
      ) : null}

      {teamId ? (
        <div className="grid grid-cols-1 gap-4">
          <CheckItem
            done={stats.hasGitHub}
            title="Connect GitHub (Pipelines)"
            description="Connect GitHub so Devorbit can sync your GitHub Actions runs."
            ctaLabel={stats.hasGitHub ? 'Manage integrations' : 'Connect GitHub'}
            ctaHref="/settings/integrations"
            secondaryHref="/pipelines"
            secondaryLabel="View pipelines"
          />

          <CheckItem
            done={stats.hasProject}
            title="Create a Project"
            description="Projects connect your repo, deployments, and servers under one team."
            ctaLabel={stats.hasProject ? 'Manage projects' : 'New project'}
            ctaHref={stats.hasProject ? '/projects' : '/projects/new'}
          />

          <CheckItem
            done={stats.projectWithRepo}
            title="Link a Repo to a Project"
            description="Set repo owner/name on a project so Pipelines can be associated with it."
            ctaLabel="Open projects"
            ctaHref="/projects"
            secondaryHref="/pipelines"
            secondaryLabel="Pipelines"
          />

          <CheckItem
            done={stats.hasAnyPipeline}
            title="See Pipeline runs"
            description="Once GitHub is connected and the repo has workflow runs, they will appear here."
            ctaLabel="Open pipelines"
            ctaHref="/pipelines"
            secondaryHref="/settings/integrations"
            secondaryLabel="Check GitHub token"
          />

          <CheckItem
            done={stats.hasServer}
            title="Add a Server (Agent)"
            description="Register a server and install the Devorbit agent to get real-time metrics."
            ctaLabel={stats.hasServer ? 'View servers' : 'Add server'}
            ctaHref={stats.hasServer ? '/servers' : '/settings/agent'}
            secondaryHref="/servers"
            secondaryLabel="Server list"
          />

          <CheckItem
            done={stats.hasAnyVpsDeployment}
            title="Enable VPS deployments (OVH / any provider)"
            description="Generate a deploy token in Projects → Manage, add it to your CI secrets, then deployments will show up automatically."
            ctaLabel="Configure tokens"
            ctaHref="/projects"
            secondaryHref="/deployments"
            secondaryLabel="View deployments"
          />

          <CheckItem
            done={stats.hasVercel && stats.projectWithVercel}
            title="(Optional) Connect Vercel deployments"
            description="If you deploy on Vercel, connect Vercel and set each project’s Vercel Project ID."
            ctaLabel="Connect Vercel"
            ctaHref="/settings/integrations"
            secondaryHref="/projects"
            secondaryLabel="Set Vercel Project ID"
          />
        </div>
      ) : null}
    </div>
  );
}

