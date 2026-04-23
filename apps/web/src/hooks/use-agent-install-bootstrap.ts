'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { DEVORBIT_TEAM_ID_KEY } from './use-team-id';

const AGENT_TOKEN_KEY = 'devorbit_agent_token';

/**
 * Ensures the user has a team + at least one server (for agentToken), then polls until one is online.
 *
 * Pass { autoCreate: false } to skip automatic server creation on mount — the returned
 * `trigger()` function must be called explicitly to start provisioning.
 */
export function useAgentInstallBootstrap({ autoCreate = false }: { autoCreate?: boolean } = {}) {
  const [teamId, setTeamId] = useState('');
  const [agentToken, setAgentToken] = useState('');
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [triggered, setTriggered] = useState(autoCreate);
  const cancelRef = useRef(false);

  function trigger() {
    setTriggered(true);
  }

  useEffect(() => {
    if (!triggered) return;

    cancelRef.current = false;

    (async () => {
      try {
        setProvisioning(true);
        setError(null);

        const workspace =
          (typeof window !== 'undefined' && localStorage.getItem('devorbit_workspace_name')) || 'My team';

        const ctx = await api.organizations.myProvisioning();

        const orgs = await api.organizations.mine().catch(() => []);
        const orgList = Array.isArray(orgs) ? orgs : [];
        let orgId = orgList[0]?._id ? String(orgList[0]._id) : '';

        const teamsList = await api.teams.mine();
        if (cancelRef.current) return;
        const tl = Array.isArray(teamsList) ? teamsList : [];

        let tid = tl[0]?._id ? String(tl[0]._id) : '';
        if (!orgId && tl[0]?.organizationId) {
          orgId = String(tl[0].organizationId);
        }

        if (!tid) {
          if (!ctx.canCreateTeams) {
            throw new Error(
              'You do not have permission to create a team or organization. Ask your organization super admin to grant workspace creation or add you to a team.',
            );
          }
          if (!orgId) {
            const o = await api.organizations.create(workspace);
            if (cancelRef.current) return;
            orgId = String(o._id);
          }
          const created = await api.teams.create(workspace, orgId);
          if (cancelRef.current) return;
          tid = String(created._id);
        }

        setTeamId(tid);
        if (typeof window !== 'undefined') localStorage.setItem(DEVORBIT_TEAM_ID_KEY, tid);

        let list = await api.servers.byTeam(tid);
        if (cancelRef.current) return;

        let tok = '';
        if (list.length === 0) {
          if (!ctx.canInstallAgent) {
            throw new Error(
              'You do not have permission to register the Devorbit agent on a server. Ask your organization super admin (or an admin with install access) to run agent setup, or to grant you install permission.',
            );
          }
          const s = await api.servers.register(tid, 'Primary server');
          tok = s.agentToken;
        } else {
          tok = list[0].agentToken;
        }
        if (cancelRef.current) return;

        setAgentToken(tok);
        if (typeof window !== 'undefined') localStorage.setItem(AGENT_TOKEN_KEY, tok);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Could not prepare agent';
        if (!cancelRef.current) setError(msg);
      } finally {
        if (!cancelRef.current) setProvisioning(false);
      }
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [triggered]);

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

  return { teamId, agentToken, provisioning, error, connected, trigger };
}
