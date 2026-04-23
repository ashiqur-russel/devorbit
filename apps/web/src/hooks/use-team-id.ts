'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Persisted default team after login / onboarding (used by dashboard and agent bootstrap). */
export const DEVORBIT_TEAM_ID_KEY = 'devorbit_team_id';

/**
 * Resolves teamId from the API (source of truth).
 * localStorage is used as an optimistic initial value to avoid flash, but is
 * always overwritten once the API responds — this prevents stale cross-session IDs.
 */
export function useTeamId(): { teamId: string | null; loading: boolean } {
  // Important: keep SSR + first client render identical to avoid hydration mismatches.
  // We only read localStorage after mount (see effect below).
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(DEVORBIT_TEAM_ID_KEY);
    if (cached) setTeamId(cached);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const teams = await api.teams.mine();
        if (cancelled) return;
        const tid = teams[0]?._id ? String(teams[0]._id) : null;
        if (typeof window !== 'undefined') {
          if (tid) localStorage.setItem(DEVORBIT_TEAM_ID_KEY, tid);
          else localStorage.removeItem(DEVORBIT_TEAM_ID_KEY);
        }
        if (!cancelled) setTeamId(tid);
      } catch {
        if (!cancelled) setLoading(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { teamId, loading };
}
