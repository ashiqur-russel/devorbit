'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type ServerRow = { _id: string; name: string; status?: string; lastSeen?: string };

export default function DashboardPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [pipelineCount, setPipelineCount] = useState(0);
  const [deploymentCount, setDeploymentCount] = useState(0);
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
          api.pipelines.recent(50),
          api.deployments.recent(50),
        ]);
        if (cancelled) return;
        setServers(sv as ServerRow[]);
        setPipelineCount(Array.isArray(pipes) ? pipes.length : 0);
        setDeploymentCount(Array.isArray(deps) ? deps.length : 0);
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
        <div className="p-6 border-b border-outline-variant/10">
          <h2 className="text-sm font-bold uppercase tracking-widest font-headline text-on-surface">Recent Pipelines</h2>
        </div>
        <div className="p-6 text-center text-on-surface-variant text-sm py-12">
          {pipelineCount === 0
            ? 'No pipelines yet. Connect GitHub to get started.'
            : `${pipelineCount} run(s) in the last fetch — open Pipelines for details.`}
        </div>
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
