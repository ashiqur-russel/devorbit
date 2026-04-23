'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function OrganizationSettingsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [orgId, setOrgId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMsg, setAdminMsg] = useState<string | null>(null);
  const [adminErr, setAdminErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [o, t] = await Promise.all([api.organizations.mine(), api.teams.mine()]);
      const ol = Array.isArray(o) ? o : [];
      const tl = Array.isArray(t) ? t : [];
      setOrgs(ol);
      setTeams(tl);
      const firstOrg = ol[0]?._id ? String(ol[0]._id) : '';
      setOrgId((prev) => (prev && ol.some((x) => String(x._id) === prev) ? prev : firstOrg));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!orgId) return;
    const inOrg = teams.filter((t) => t.organizationId && String(t.organizationId) === orgId);
    if (inOrg.length && !inOrg.some((t) => String(t._id) === teamId)) {
      setTeamId(String(inOrg[0]._id));
    }
  }, [orgId, teams, teamId]);

  const teamsForOrg = orgId
    ? teams.filter((t) => t.organizationId && String(t.organizationId) === orgId)
    : [];

  const promoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    setAdminErr(null);
    if (!orgId || !adminEmail.trim()) return;
    try {
      await api.organizations.promoteAdmin(orgId, adminEmail.trim());
      setAdminMsg(`${adminEmail.trim()} is now an organization admin.`);
      setAdminEmail('');
    } catch (e: unknown) {
      setAdminErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!orgId || !teamId || !email.trim()) {
      setError('Choose organization and team, and enter the user’s email.');
      return;
    }
    try {
      await api.organizations.addTeamMember(orgId, teamId, email.trim());
      setMessage(`Added ${email.trim()} to the team. They must already have a Devorbit account.`);
      setEmail('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/settings/agent"
          className="text-xs font-bold uppercase tracking-widest text-outline hover:text-primary"
        >
          ← Agent
        </Link>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tighter text-on-surface">Organization &amp; team</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The user who creates an organization is its <strong className="text-on-surface">super admin</strong>. Super
          admins and org <strong className="text-on-surface">admins</strong> can add people to teams by email (account must
          exist). Teams must belong to the organization (not legacy orphan teams).
        </p>
      </div>

      {loading && <p className="text-sm text-outline">Loading…</p>}
      {error && !loading && <p className="text-sm text-error font-mono">{error}</p>}

      {!loading && orgs.length === 0 && (
        <p className="text-sm text-on-surface-variant">
          No organizations yet. Use <Link href="/register" className="text-primary underline">Register</Link> to create
          one, or sign in with GitHub and complete onboarding (which creates an org + default team).
        </p>
      )}

      {orgs.length > 0 && (
        <form
          onSubmit={promoteAdmin}
          className="space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6"
        >
          <h2 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
            Promote org admin (super admin only)
          </h2>
          <p className="text-xs text-on-surface-variant">
            Org admins can add users to teams. The user must already be in the organization (e.g. added to a team first,
            or register as part of your onboarding flow).
          </p>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="future-admin@company.com"
            className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-surface-container-highest px-5 py-2 text-xs font-bold uppercase tracking-widest text-on-surface">
            Make org admin
          </button>
          {adminErr && <p className="text-xs font-mono text-error">{adminErr}</p>}
          {adminMsg && <p className="text-xs text-tertiary">{adminMsg}</p>}
        </form>
      )}

      {orgs.length > 0 && (
        <form onSubmit={addMember} className="space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Organization</label>
            <select
              value={orgId}
              onChange={(e) => {
                setOrgId(e.target.value);
                setTeamId('');
              }}
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-sm"
            >
              {orgs.map((o) => (
                <option key={String(o._id)} value={String(o._id)}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Team</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-sm"
              required
            >
              <option value="" disabled>
                {teamsForOrg.length ? 'Select team' : 'No teams linked to this org'}
              </option>
              {teamsForOrg.map((t) => (
                <option key={String(t._id)} value={String(t._id)}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">User email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2 text-sm"
              placeholder="colleague@company.com"
              required
            />
          </div>
          <button
            type="submit"
            disabled={!teamsForOrg.length}
            className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-40"
          >
            Add to team
          </button>
          {message && <p className="text-sm text-tertiary">{message}</p>}
        </form>
      )}
    </div>
  );
}
