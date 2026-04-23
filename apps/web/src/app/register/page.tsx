'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.auth.register({
        email: email.trim(),
        password,
        organizationName: organizationName.trim(),
        displayName: displayName.trim() || undefined,
      });
      localStorage.setItem('devorbit_token', token);
      router.replace('/onboarding/step-1');
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
        <p className="mt-2 text-sm text-on-surface-variant">
          You become <strong className="text-on-surface">super admin</strong> of a new organization and get a default
          team.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
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
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
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
            disabled={loading}
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
