'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const TEAM_KEY = 'devorbit_team_id';
const AGENT_TOKEN_KEY = 'devorbit_agent_token';

/**
 * Ensures the user has a team + at least one server (for agentToken), then polls until one is online.
 */
export function useAgentInstallBootstrap() {
  const [teamId, setTeamId] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [provisioning, setProvisioning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setProvisioning(true);
        setError(null);

        const teams = await api.teams.mine();
        if (cancelled) return;

        let tid = teams[0]?._id ? String(teams[0]._id) : '';
        if (!tid) {
          const workspace =
            (typeof window !== 'undefined' &&
              localStorage.getItem('devorbit_workspace_name')) ||
            'My team';
          const created = await api.teams.create(workspace);
          if (cancelled) return;
          tid = String(created._id);
        }

        setTeamId(tid);
        if (typeof window !== 'undefined') localStorage.setItem(TEAM_KEY, tid);

        let list = await api.servers.byTeam(tid);
        if (cancelled) return;

        let tok = '';
        if (list.length === 0) {
          const s = await api.servers.register(tid, 'Primary server');
          tok = s.agentToken;
        } else {
          tok = list[0].agentToken;
        }
        if (cancelled) return;

        setAgentToken(tok);
        if (typeof window !== 'undefined') localStorage.setItem(AGENT_TOKEN_KEY, tok);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not prepare agent';
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setProvisioning(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!teamId || !agentToken || connected) return;

    const iv = setInterval(async () => {
      try {
        const servers = await api.servers.byTeam(teamId);
        if (servers.some((s: { status?: string }) => s.status === 'online')) {
          setConnected(true);
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);

    return () => clearInterval(iv);
  }, [teamId, agentToken, connected]);

  return { teamId, agentToken, provisioning, error, connected };
}
