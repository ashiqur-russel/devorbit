'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { api } from '@/lib/api';
import { DEVORBIT_TEAM_ID_KEY } from '@/hooks/use-team-id';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      router.replace('/login');
      return;
    }

    localStorage.setItem('devorbit_token', token);

    let cancelled = false;

    (async () => {
      try {
        const teams = await api.teams.mine();
        if (cancelled) return;
        const list = Array.isArray(teams) ? teams : [];
        const firstId = list[0]?._id ? String(list[0]._id) : '';

        if (firstId) {
          if (!cancelled) {
            localStorage.setItem(DEVORBIT_TEAM_ID_KEY, firstId);
            router.replace('/dashboard');
          }
          return;
        }
      } catch {
        /* fall through to onboarding if API fails */
      }

      if (!cancelled) router.replace('/onboarding/step-1');
    })();

    return () => {
      cancelled = true;
    };
  }, [params, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-primary font-headline text-2xl font-black uppercase tracking-tighter animate-pulse">
          Authenticating...
        </div>
        <div className="w-48 h-1 bg-surface-container-highest rounded-full mx-auto overflow-hidden">
          <div className="h-full w-1/2 bg-primary scanline-progress" />
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackInner />
    </Suspense>
  );
}
