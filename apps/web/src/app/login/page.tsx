'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await api.auth.loginEmail(email.trim(), password);
      localStorage.setItem('devorbit_token', token);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background text-on-surface">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(208,188,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(208,188,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="pointer-events-none fixed -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[120px]" />

      <main className="relative z-10 flex flex-grow items-center justify-center p-6">
        <div className="group relative w-full max-w-md">
          <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 opacity-75 blur-sm transition duration-500 group-hover:opacity-100" />

          <div className="relative flex flex-col items-center rounded-xl border border-outline-variant/10 bg-surface-container-low/80 p-8 shadow-2xl backdrop-blur-2xl md:p-12">
            <div className="mb-8 text-center">
              <span className="font-headline text-3xl font-black italic tracking-tighter text-primary">DevOrbit</span>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-on-surface-variant">Sign in</p>
            </div>

            <div className="w-full space-y-6">
              <a
                href={`${apiUrl}/api/v1/auth/github`}
                className="group/btn relative flex w-full items-center justify-center gap-4 rounded-xl bg-surface-container-highest py-4 px-6 text-on-surface transition-all duration-200 hover:bg-surface-bright active:scale-95"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12" />
                </svg>
                <span className="text-base font-semibold tracking-tight">Continue with GitHub</span>
              </a>

              <div className="relative py-2 text-center text-[10px] font-bold uppercase tracking-widest text-outline">
                <span className="bg-surface-container-low/80 px-2">or email</span>
              </div>

              <form onSubmit={emailLogin} className="space-y-3">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-outline"
                />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-outline"
                />
                {error && <p className="text-xs font-mono text-error">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
                >
                  {loading ? 'Signing in…' : 'Sign in with email'}
                </button>
              </form>

              <p className="text-center text-xs text-on-surface-variant">
                New here?{' '}
                <Link href="/register" className="font-bold text-primary underline">
                  Create organization &amp; account
                </Link>
              </p>

              <div className="flex items-center justify-center gap-6 border-t border-outline-variant/10 pt-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                <Link href="/" className="transition-colors hover:text-primary">
                  Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between p-6 text-xs uppercase tracking-widest text-on-surface-variant/40">
        <span>DevOrbit</span>
        <span>© 2026</span>
      </footer>
    </div>
  );
}
