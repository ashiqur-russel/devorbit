'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeToServer } from '@/lib/socket';
import MetricChart from '@/components/charts/MetricChart';

const MAX_POINTS = 30;

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

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ServerDetailPage({ params }: { params: { id: string } }) {
  const [cpu, setCpu] = useState<MetricPoint[]>([]);
  const [ram, setRam] = useState<MetricPoint[]>([]);
  const [disk, setDisk] = useState<MetricPoint[]>([]);
  const [latest, setLatest] = useState<LiveMetric | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToServer(params.id, (metric: LiveMetric) => {
      const point = { time: formatTime(new Date()), value: 0 };
      setConnected(true);
      setLatest(metric);
      setCpu((prev) => [...prev.slice(-(MAX_POINTS - 1)), { ...point, value: metric.cpu }]);
      setRam((prev) => [...prev.slice(-(MAX_POINTS - 1)), { ...point, value: metric.ram }]);
      setDisk((prev) => [...prev.slice(-(MAX_POINTS - 1)), { ...point, value: metric.disk }]);
    });
    return unsubscribe;
  }, [params.id]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1" style={{ color: connected ? '#4edea3' : '#cbc3d7' }}>
            <span
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: connected ? '#4edea3' : '#494454',
                animation: connected ? 'pulse 2s infinite' : 'none',
              }}
            />
            <span className="text-xs font-bold uppercase tracking-widest font-headline">
              {connected ? 'Agent Connected' : 'Waiting for Agent…'}
            </span>
          </div>
          <h1 className="text-4xl font-black text-on-surface font-headline tracking-tighter">
            Server Detail
          </h1>
          <p className="text-on-surface-variant text-sm mt-1 font-mono">{params.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Hardware identity */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/5">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 font-headline">
              Live Metrics
            </h3>
            <div className="space-y-3">
              {[
                { label: 'CPU', value: latest ? `${latest.cpu.toFixed(1)}%` : '—' },
                { label: 'RAM', value: latest ? `${latest.ram.toFixed(1)}%` : '—' },
                { label: 'Disk', value: latest ? `${latest.disk.toFixed(1)}%` : '—' },
                {
                  label: 'Net In',
                  value: latest ? `${(latest.networkIn / 1024).toFixed(1)} KB/s` : '—',
                },
                {
                  label: 'Net Out',
                  value: latest ? `${(latest.networkOut / 1024).toFixed(1)} KB/s` : '—',
                },
                { label: 'Agent ID', value: params.id.slice(0, 12) + '…' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex justify-between items-center py-2 border-b border-outline-variant/10"
                >
                  <span className="text-xs text-on-surface-variant uppercase tracking-tighter">
                    {row.label}
                  </span>
                  <span className="text-sm font-mono text-on-surface">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <MetricChart
            data={cpu}
            color="#4cd7f6"
            label="CPU Load"
            currentValue={latest?.cpu ?? null}
          />
          <MetricChart
            data={ram}
            color="#d0bcff"
            label="RAM Memory"
            currentValue={latest?.ram ?? null}
          />
          <div className="col-span-1 sm:col-span-2">
            <MetricChart
              data={disk}
              color="#4edea3"
              label="Disk Usage"
              currentValue={latest?.disk ?? null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
