'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type MemberRow = {
  role: string;
  userId: string;
  name?: string;
  email?: string;
};

export default function OrganizationDashboardPage() {
  const params = useParams();
  const orgId = typeof params.orgId === 'string' ? params.orgId : '';

  const [data, setData] = useState<{
    organization: { name: string; slug: string; members: MemberRow[] };
    teams: { _id: string; name: string; memberCount: number }[];
    pendingInvites: { email: string; expiresAt: string; teamId: string | null; teamName: string | null }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const d = await api.organizations.dashboard(orgId);
        if (!cancelled) setData(d);
      } catch (e: unknown) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/dashboard/organization"
          className="text-xs font-bold uppercase tracking-widest text-outline hover:text-primary"
        >
          ← All organizations
        </Link>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tighter text-on-surface">
          {data?.organization.name || 'Organization'}
        </h1>
        {data?.organization.slug && (
          <p className="mt-1 font-mono text-xs text-on-surface-variant">{data.organization.slug}</p>
        )}
      </div>

      {loading && <p className="text-sm text-outline">Loading…</p>}
      {error && <p className="text-sm text-error font-mono">{error}</p>}

      {data && (
        <>
          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
            <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Members</h2>
            <ul className="mt-4 divide-y divide-outline-variant/10">
              {data.organization.members.map((m) => (
                <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <span className="font-medium text-on-surface">{m.name || m.email || m.userId}</span>
                    {m.email && m.name ? (
                      <span className="ml-2 text-on-surface-variant">{m.email}</span>
                    ) : null}
                  </div>
                  <span className="rounded-md bg-surface-container-highest px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-outline">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
            <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">Teams</h2>
            {data.teams.length === 0 ? (
              <p className="mt-4 text-sm text-on-surface-variant">No teams in this organization yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {data.teams.map((t) => (
                  <li
                    key={t._id}
                    className="flex items-center justify-between rounded-lg border border-outline-variant/10 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-on-surface">{t.name}</span>
                    <span className="text-xs text-on-surface-variant">{t.memberCount} members</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {data.pendingInvites.length > 0 && (
            <section className="rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
              <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
                Pending email invites
              </h2>
              <ul className="mt-4 divide-y divide-outline-variant/10">
                {data.pendingInvites.map((inv) => (
                  <li key={inv.email} className="py-3 text-sm">
                    <span className="text-on-surface">{inv.email}</span>
                    {inv.teamName ? (
                      <span className="ml-2 text-on-surface-variant">→ {inv.teamName}</span>
                    ) : null}
                    <span className="mt-1 block text-xs text-outline">
                      Expires {new Date(inv.expiresAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-xs text-on-surface-variant">
            Manage invites and team membership in{' '}
            <Link href="/settings/organization" className="text-primary underline">
              Settings → Organization
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}
