'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function OrganizationListPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const o = await api.organizations.mine();
        if (!cancelled) setOrgs(Array.isArray(o) ? o : []);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface">Organizations</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Open an organization dashboard to see members, teams, and pending email invites.
        </p>
      </div>

      {loading && <p className="text-sm text-outline">Loading…</p>}
      {error && <p className="text-sm text-error font-mono">{error}</p>}

      {!loading && orgs.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          You are not in any organization yet.{' '}
          <Link href="/register" className="text-primary underline">
            Register
          </Link>{' '}
          to create one, or accept an invite from your super admin.
        </p>
      )}

      <ul className="space-y-3">
        {orgs.map((o) => (
          <li key={String(o._id)}>
            <Link
              href={`/dashboard/organization/${String(o._id)}`}
              className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low px-5 py-4 transition-colors hover:border-primary/30"
            >
              <span className="font-headline font-bold text-on-surface">{o.name}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Dashboard →</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
