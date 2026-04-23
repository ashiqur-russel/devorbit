'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { api } from '@/lib/api';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteFromUrl = searchParams.get('invite')?.trim() || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    email: string;
    organizationName: string;
    teamName: string | null;
  } | null>(null);
  const [inviteLoadError, setInviteLoadError] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (!inviteFromUrl || inviteFromUrl.length < 32) {
      setInvitePreview(null);
      setInviteLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setInviteLoading(true);
      setInviteLoadError(null);
      try {
        const p = await api.invitations.preview(inviteFromUrl);
        if (cancelled) return;
        setInvitePreview({
          email: p.email,
          organizationName: p.organizationName,
          teamName: p.teamName,
        });
        setEmail(p.email);
      } catch (e: unknown) {
        if (!cancelled) {
          setInvitePreview(null);
          setInviteLoadError(e instanceof Error ? e.message : 'Invalid invite');
        }
      } finally {
        if (!cancelled) setInviteLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [inviteFromUrl]);

  const activeInviteToken =
    invitePreview && inviteFromUrl.length >= 32 && inviteFromUrl ? inviteFromUrl : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Parameters<typeof api.auth.register>[0] = {
        email: email.trim(),
        password,
        displayName: displayName.trim() || undefined,
      };
      if (activeInviteToken) {
        body.inviteToken = activeInviteToken;
      } else {
        body.organizationName = organizationName.trim();
      }
      const { token, organizationId } = await api.auth.register(body);
      localStorage.setItem('devorbit_token', token);
      if (activeInviteToken) {
        router.replace(`/dashboard/organization/${organizationId}`);
      } else {
        router.replace('/onboarding/step-1');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-on-surface">
      <div className="w-full max-w-md rounded-xl border border-outline-variant/10 bg-surface-container-low p-8 shadow-xl">
        <h1 className="font-headline text-2xl font-black tracking-tighter">Create account</h1>
        {activeInviteToken ? (
          <p className="mt-2 text-sm text-on-surface-variant">
            You are joining <strong className="text-on-surface">{invitePreview?.organizationName}</strong>
            {invitePreview?.teamName ? (
              <>
                {' '}
                on team <strong className="text-on-surface">{invitePreview.teamName}</strong>
              </>
            ) : null}
            . Use the invited email and a password to finish setup.
          </p>
        ) : (
          <p className="mt-2 text-sm text-on-surface-variant">
            You become <strong className="text-on-surface">super admin</strong> of a new organization and get a default
            team.
          </p>
        )}

        {inviteFromUrl && inviteFromUrl.length >= 32 && inviteLoading && (
          <p className="mt-4 text-xs text-outline">Checking invite…</p>
        )}
        {inviteLoadError && (
          <p className="mt-4 text-sm text-error font-mono">
            {inviteLoadError}{' '}
            <Link href="/register" className="text-primary underline">
              Start without invite
            </Link>
          </p>
        )}

        <form onSubmit={submit} className="mt-8 space-y-4">
          {!activeInviteToken && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-outline">Organization</label>
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                minLength={2}
                placeholder="Acme Inc"
              />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Your name (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm disabled:opacity-60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={!!activeInviteToken}
            />
            {activeInviteToken && (
              <p className="mt-1 text-[11px] text-on-surface-variant">Email is fixed to match the invitation.</p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Password (8+ chars)</label>
            <input
              type="password"
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {error && <p className="text-sm text-error font-mono">{error}</p>}
          <button
            type="submit"
            disabled={loading || (!!inviteFromUrl && inviteFromUrl.length >= 32 && !invitePreview)}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-outline">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-primary underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-on-surface-variant text-sm">
          Loading…
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
