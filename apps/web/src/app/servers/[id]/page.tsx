'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { subscribeToServer } from '@/lib/socket';
import { api } from '@/lib/api';
import MetricChart from '@/components/charts/MetricChart';

const MAX_POINTS = 48;

interface MetricPoint {
  time: string;
  value: number;
}

interface LiveMetric {
  cpu: number;
  ram: number;
  disk: number;
  networkIn: number;
  networkOut: number;
}

interface ServerDoc {
  name?: string;
  status?: string;
  lastSeen?: string;
  agentToken?: string;
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatRelative(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleString();
}

function maskToken(t?: string) {
  if (!t) return '—';
  if (t.length <= 14) return `${t.slice(0, 6)}…`;
  return `${t.slice(0, 12)}…`;
}

function pickTs(r: any): Date {
  const t = r?.timestamp;
  if (t instanceof Date) return t;
  if (typeof t === 'string') return new Date(t);
  if (t && typeof t === 'object' && '$date' in t) return new Date((t as { $date: string }).$date);
  return new Date();
}

function rowsToPoints(rows: any[], key: 'cpu' | 'ram' | 'disk'): MetricPoint[] {
  return rows.map((r) => ({
    time: formatTime(pickTs(r)),
    value: Number(r[key]) || 0,
  }));
}

export default function ServerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<ServerDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cpu, setCpu] = useState<MetricPoint[]>([]);
  const [ram, setRam] = useState<MetricPoint[]>([]);
  const [disk, setDisk] = useState<MetricPoint[]>([]);
  const [latest, setLatest] = useState<LiveMetric | null>(null);
  const [connected, setConnected] = useState(false);

  const pushPoint = useCallback((metric: LiveMetric) => {
    const t = formatTime(new Date());
    const next = (prev: MetricPoint[], v: number) =>
      [...prev.slice(-(MAX_POINTS - 1)), { time: t, value: v }];
    setCpu((p) => next(p, metric.cpu));
    setRam((p) => next(p, metric.ram));
    setDisk((p) => next(p, metric.disk));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadError(null);
        const [srv, recent, latestRow] = await Promise.all([
          api.servers.get(id),
          api.metrics.recent(id, 45),
          api.metrics.latest(id).catch(() => null),
        ]);
        if (cancelled) return;
        setServer(srv as ServerDoc);
        const rows = Array.isArray(recent) ? recent : [];
        setCpu(rowsToPoints(rows, 'cpu'));
        setRam(rowsToPoints(rows, 'ram'));
        setDisk(rowsToPoints(rows, 'disk'));
        if (latestRow && typeof latestRow === 'object' && 'cpu' in latestRow) {
          const m = latestRow as any;
          setLatest({
            cpu: m.cpu,
            ram: m.ram,
            disk: m.disk,
            networkIn: m.networkIn ?? 0,
            networkOut: m.networkOut ?? 0,
          });
        }
      } catch (e: unknown) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : 'Failed to load server');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const unsubscribe = subscribeToServer(id, (metric: LiveMetric) => {
      setConnected(true);
      setLatest(metric);
      pushPoint(metric);
    });
    return unsubscribe;
  }, [id, pushPoint]);

  const netFmt = (bps: number) => {
    if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(2)} MB/s`;
    if (bps >= 1024) return `${(bps / 1024).toFixed(1)} KB/s`;
    return `${bps.toFixed(0)} B/s`;
  };

  return (
    <div className="space-y-10">
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(76,215,246,0.35), transparent 45%), radial-gradient(circle at 85% 10%, rgba(208,188,255,0.25), transparent 40%)',
        }}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <Link
            href="/servers"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-outline transition-colors hover:text-primary"
          >
            ← Servers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                connected || server?.status === 'online'
                  ? 'border-secondary/40 bg-secondary/10 text-secondary'
                  : 'border-outline-variant/30 bg-surface-container-high text-on-surface-variant'
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor: connected || server?.status === 'online' ? '#4edea3' : '#6f6a7a',
                  boxShadow:
                    connected || server?.status === 'online' ? '0 0 10px rgba(78,222,163,0.7)' : 'none',
                }}
              />
              {connected || server?.status === 'online' ? 'Live stream' : 'Waiting for agent'}
            </span>
            <span className="text-xs text-on-surface-variant">
              Last seen API: {formatRelative(server?.lastSeen)}
            </span>
          </div>
          <h1 className="font-headline text-4xl font-black tracking-tighter text-on-surface sm:text-5xl">
            {server?.name || 'Server'}
          </h1>
          <p className="font-mono text-xs text-on-surface-variant sm:text-sm">{id}</p>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">{loadError}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <div className="relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl" />
            <h3 className="relative font-headline text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
              Live snapshot
            </h3>
            <p className="relative mt-1 text-xs text-on-surface-variant">
              Pulled from the latest agent payload and your stored metrics.
            </p>
            <dl className="relative mt-6 space-y-4">
              {[
                { label: 'CPU', value: latest ? `${latest.cpu.toFixed(1)}%` : '—' },
                { label: 'RAM', value: latest ? `${latest.ram.toFixed(1)}%` : '—' },
                { label: 'Disk', value: latest ? `${latest.disk.toFixed(1)}%` : '—' },
                { label: 'Net in', value: latest ? netFmt(latest.networkIn) : '—' },
                { label: 'Net out', value: latest ? netFmt(latest.networkOut) : '—' },
                { label: 'Agent token', value: maskToken(server?.agentToken) },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b border-outline-variant/10 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {row.label}
                  </dt>
                  <dd className="font-mono text-sm font-semibold text-on-surface">{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <section className="space-y-6 lg:col-span-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <MetricChart
              data={cpu}
              color="#4cd7f6"
              label="CPU load"
              description="Rolling window from your database + live agent."
              currentValue={latest?.cpu ?? null}
            />
            <MetricChart
              data={ram}
              color="#d0bcff"
              label="RAM used %"
              description="Percentage of system memory in use."
              currentValue={latest?.ram ?? null}
            />
          </div>
          <MetricChart
            data={disk}
            color="#4edea3"
            label="Disk used %"
            description="Primary volume utilization reported by the agent."
            currentValue={latest?.disk ?? null}
          />
        </section>
      </div>
    </div>
  );
}
