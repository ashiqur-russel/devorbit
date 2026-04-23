'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type ServerRow = { _id: string; name: string; status?: string; lastSeen?: string };

type PipelinePreview = { _id: string; workflowName?: string; status?: string; createdAt?: string };
type DeploymentPreview = { _id: string; platform?: string; status?: string; url?: string; deployedAt?: string };

function previewTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function DashboardPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [deploymentCount, setDeploymentCount] = useState(0);
  const [pipelinePreview, setPipelinePreview] = useState<PipelinePreview[]>([]);
  const [deploymentPreview, setDeploymentPreview] = useState<DeploymentPreview[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadError(null);
        setStatsLoading(true);
        const [sv, pipes, deps] = await Promise.all([
          api.servers.byTeam(teamId),
          api.pipelines.recentByTeam(teamId, 50),
          api.deployments.recentByTeam(teamId, 50),
        ]);
        if (cancelled) return;
        setServers(sv as ServerRow[]);
        const pipeArr = Array.isArray(pipes) ? pipes : [];
        const depArr = Array.isArray(deps) ? deps : [];
        setPipelineCount(pipeArr.length);
        setDeploymentCount(depArr.length);
        setPipelinePreview(pipeArr.slice(0, 5) as PipelinePreview[]);
        setDeploymentPreview(depArr.slice(0, 5) as DeploymentPreview[]);
      } catch (e: unknown) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();

    const iv = setInterval(async () => {
      if (!teamId || cancelled) return;
      try {
        const sv = await api.servers.byTeam(teamId);
        if (!cancelled) setServers(sv as ServerRow[]);
      } catch {
        /* ignore */
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [teamId]);

  const online = servers.filter((s) => s.status === 'online').length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">Dashboard</h1>
        <p className="text-on-surface-variant text-sm mt-1">Infrastructure overview</p>
      </div>

      {loadError && <p className="text-sm text-error font-mono">{loadError}</p>}
      {!teamLoading && !teamId && (
        <p className="text-sm text-on-surface-variant">
          No team yet. Finish{' '}
          <Link href="/onboarding/step-1" className="text-primary underline">
            onboarding
          </Link>{' '}
          or create a team from the API.
        </p>
      )}

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary font-headline">Active Servers</p>
            <span className="text-2xl text-secondary">⬡</span>
          </div>
          <p className="text-4xl font-black font-headline tracking-tighter text-on-surface">
            {!teamId ? '—' : statsLoading ? '…' : online}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            {!teamId ? '' : statsLoading ? '' : `${servers.length} registered`}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-primary font-headline">Pipeline Runs (recent)</p>
            <span className="text-2xl text-primary">⟩</span>
          </div>
          <p className="text-4xl font-black font-headline tracking-tighter text-on-surface">
            {teamId ? (statsLoading ? '…' : pipelineCount) : '—'}
          </p>
        </div>
        <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold uppercase tracking-widest text-tertiary font-headline">Deployments (recent)</p>
            <span className="text-2xl text-tertiary">↑</span>
          </div>
          <p className="text-4xl font-black font-headline tracking-tighter text-on-surface">
            {teamId ? (statsLoading ? '…' : deploymentCount) : '—'}
          </p>
        </div>
      </div>

      {/* Recent pipelines */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Recent Pipelines</h2>
          <Link href="/pipelines" className="text-xs font-bold uppercase text-primary hover:underline">
            View all
          </Link>
        </div>
        {pipelineCount === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
            No pipelines yet for this team. Connect GitHub or GitLab under Settings → Integrations.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/5">
            {pipelinePreview.map((p) => (
              <li key={p._id} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-white/[0.03]">
                <span className="truncate font-mono text-xs text-on-surface">{p.workflowName || p._id}</span>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase ${
                    p.status === 'success'
                      ? 'text-tertiary'
                      : p.status === 'failure'
                        ? 'text-error'
                        : 'text-secondary'
                  }`}
                >
                  {p.status || '—'}
                </span>
                <span className="shrink-0 text-xs text-outline">{previewTime(p.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Recent deployments */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5">
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-6">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Recent Deployments</h2>
          <Link href="/deployments" className="text-xs font-bold uppercase text-primary hover:underline">
            View all
          </Link>
        </div>
        {deploymentCount === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-on-surface-variant">
            No deployments recorded yet. Connect a platform or register servers to see releases here.
          </div>
        ) : (
          <ul className="divide-y divide-outline-variant/5">
            {deploymentPreview.map((d) => (
              <li key={d._id} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-white/[0.03]">
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-on-surface">{d.platform || '—'}</span>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block truncate font-mono text-[11px] text-secondary hover:underline"
                    >
                      {d.url}
                    </a>
                  ) : null}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase ${
                    d.status === 'success' ? 'text-tertiary' : d.status === 'failure' ? 'text-error' : 'text-secondary'
                  }`}
                >
                  {d.status || '—'}
                </span>
                <span className="shrink-0 text-xs text-outline">{previewTime(d.deployedAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Server health */}
      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5">
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Server Health</h2>
          <Link href="/settings/agent" className="text-xs font-bold uppercase text-primary hover:underline">
            Install agent
          </Link>
        </div>
        <div className="p-6">
          {servers.length === 0 ? (
            <p className="text-center text-on-surface-variant text-sm py-8">
              No servers registered for this team yet. Use{' '}
              <Link href="/settings/agent" className="text-primary underline">
                Settings → Agent
              </Link>{' '}
              or finish onboarding to register a server and run the agent.
            </p>
          ) : (
            <ul className="space-y-3">
              {servers.map((s) => (
                <li key={s._id}>
                  <Link
                    href={`/servers/${s._id}`}
                    className="flex items-center justify-between rounded-lg border border-outline-variant/10 px-4 py-3 hover:bg-surface-container-high transition-colors"
                  >
                    <span className="font-medium text-on-surface">{s.name}</span>
                    <span
                      className={`text-xs font-bold uppercase ${
                        s.status === 'online' ? 'text-secondary' : 'text-outline'
                      }`}
                    >
                      {s.status || 'offline'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
