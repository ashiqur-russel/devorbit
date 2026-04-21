'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      localStorage.setItem('devorbit_token', token);
      router.replace('/onboarding/step-1');
    } else {
      router.replace('/login');
    }
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
