'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type ServerRow = { _id: string; name: string; status?: string };

export default function ServersPage() {
  const { teamId, loading: teamLoading } = useTeamId();
  const [servers, setServers] = useState<ServerRow[]>([]);

  useEffect(() => {
    if (!teamId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const sv = await api.servers.byTeam(teamId);
        if (!cancelled) setServers(sv as ServerRow[]);
      } catch {
        if (!cancelled) setServers([]);
      }
    };

    load();
    const iv = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [teamId]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">Servers</h1>
          <p className="text-on-surface-variant text-sm mt-1">Connected nodes and health status</p>
        </div>
        <Link
          href="/settings/agent"
          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold font-headline uppercase tracking-widest hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all"
        >
          + Add Server
        </Link>
      </div>

      {!teamLoading && !teamId && (
        <p className="text-sm text-on-surface-variant">
          No team found. Complete{' '}
          <Link href="/onboarding/step-1" className="text-primary underline">
            onboarding
          </Link>{' '}
          first.
        </p>
      )}

      {teamId && servers.length === 0 && (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 text-2xl">⬡</div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2">No nodes connected yet</h3>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto mb-6">
            Once the agent starts running on your hardware, it will appear here as a manageable cluster node.
          </p>
          <Link
            href="/settings/agent"
            className="inline-block px-6 py-3 bg-surface-container-highest text-on-surface rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-surface-bright transition-colors"
          >
            Install Agent
          </Link>
        </div>
      )}

      {teamId && servers.length > 0 && (
        <ul className="space-y-3">
          {servers.map((s) => (
            <li key={s._id}>
              <Link
                href={`/servers/${s._id}`}
                className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low px-6 py-4 hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="font-headline font-bold text-on-surface">{s.name}</p>
                  <p className="text-xs text-on-surface-variant font-mono mt-1">{s._id}</p>
                </div>
                <span
                  className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                    s.status === 'online' ? 'bg-secondary/20 text-secondary' : 'bg-surface-container-highest text-outline'
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
  );
}
