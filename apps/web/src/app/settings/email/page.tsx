'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function EmailTestPage() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [provider, setProvider] = useState<string>('none');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await api.mail.status();
      setConfigured(Boolean(s.configured));
      setProvider(s.provider || 'none');
    } catch {
      setConfigured(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sendTest = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const r = await api.mail.sendTest(to.trim() || undefined);
      setMessage(`Sent via ${r.via} (id: ${r.id}) → ${r.to}`);
      await loadStatus();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/settings/agent"
          className="mb-3 inline-flex text-xs font-bold uppercase tracking-widest text-outline hover:text-primary"
        >
          ← Agent setup
        </Link>
        <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface">Email (test)</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The API sends mail through <strong className="text-on-surface">Gmail (SMTP)</strong> if{' '}
          <code className="text-xs text-primary">GMAIL_USER</code> and{' '}
          <code className="text-xs text-primary">GMAIL_APP_PASSWORD</code> are set; otherwise through{' '}
          <a href="https://resend.com" className="text-secondary underline" target="_blank" rel="noopener noreferrer">
            Resend
          </a>{' '}
          if <code className="text-xs text-primary">RESEND_API_KEY</code> is set. Use{' '}
          <code className="text-xs text-primary">MAIL_PROVIDER=gmail</code> or <code className="text-xs">resend</code> to
          force one when both are configured.
        </p>
        <p className="mt-2 text-xs text-outline">
          Gmail: Google Account → Security → 2-Step Verification → App passwords. Use that 16-character password as{' '}
          <code className="text-primary">GMAIL_APP_PASSWORD</code> (spaces optional).
        </p>
      </div>

      {configured === false && (
        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-high px-4 py-3 text-sm text-on-surface-variant">
          API reports mail is not configured. Add <strong className="text-on-surface">GMAIL_USER</strong> +{' '}
          <strong className="text-on-surface">GMAIL_APP_PASSWORD</strong> and/or <strong className="text-on-surface">RESEND_API_KEY</strong> to your{' '}
          <code className="text-xs">.env</code>, then restart the API.
        </div>
      )}

      {configured === true && (
        <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 px-4 py-3 text-sm text-tertiary">
          Mail is configured (<span className="font-mono uppercase">{provider}</span>). You can send a test message.
        </div>
      )}

      <div className="space-y-4 rounded-xl border border-outline-variant/10 bg-surface-container-low p-6">
        <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant">
          To (optional)
        </label>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="Leave empty to use your GitHub email on file"
          className="w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-sm text-on-surface placeholder:text-outline"
        />
        <button
          type="button"
          onClick={sendTest}
          disabled={loading || configured === false}
          className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-40"
        >
          {loading ? 'Sending…' : 'Send test email'}
        </button>
      </div>

      {message && <p className="text-sm text-tertiary">{message}</p>}
      {error && <p className="text-sm text-error font-mono">{error}</p>}
    </div>
  );
}
