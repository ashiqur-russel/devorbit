'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/** Persisted default team after login / onboarding (used by dashboard and agent bootstrap). */
export const DEVORBIT_TEAM_ID_KEY = 'devorbit_team_id';

/** Resolves team id from localStorage or `GET /teams`. */
export function useTeamId(): { teamId: string | null; loading: boolean } {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        let tid = typeof window !== 'undefined' ? localStorage.getItem(DEVORBIT_TEAM_ID_KEY) : null;
        if (!tid) {
          const teams = await api.teams.mine();
          if (cancelled) return;
          tid = teams[0]?._id ? String(teams[0]._id) : null;
          if (tid && typeof window !== 'undefined') localStorage.setItem(DEVORBIT_TEAM_ID_KEY, tid);
        }
        if (!cancelled) setTeamId(tid);
      } catch {
        if (!cancelled) setTeamId(null);
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
