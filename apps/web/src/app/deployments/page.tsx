'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const platformIcon: Record<string, string> = {
  VERCEL: '▲',
  OVH: '⬡',
  AWS: '☁',
  DIGITALOCEAN: '◎',
  CUSTOM: '⬡',
};

const statusColor: Record<string, string> = {
  success: 'text-tertiary',
  failure: 'text-error',
  building: 'text-secondary',
  cancelled: 'text-outline',
};

const statusDot: Record<string, string> = {
  success: 'bg-tertiary',
  failure: 'bg-error',
  building: 'bg-secondary',
  cancelled: 'bg-outline',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.deployments
      .recent(50)
      .then(setDeployments)
      .catch(() => setDeployments([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">
            Deployments
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Registry of all deployed applications</p>
        </div>
        <a
          href="/settings/integrations"
          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold font-headline uppercase tracking-widest hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all"
        >
          + Connect Platform
        </a>
      </div>

      {loading ? (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-12 text-center text-outline text-sm">
          Loading…
        </div>
      ) : deployments.length === 0 ? (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mx-auto mb-4 text-2xl">
            ↑
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface mb-2">No deployments yet</h3>
          <p className="text-on-surface-variant text-sm max-w-md mx-auto">
            Connect Vercel, OVH or your own server to start tracking deployments.
          </p>
        </div>
      ) : (
        <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">
              All Deployments
            </span>
            <span className="text-xs font-mono text-outline px-2 py-1 bg-surface-container-highest rounded">
              {deployments.length} total
            </span>
          </div>
          <table className="w-full">
            <thead className="border-b border-outline-variant/10">
              <tr className="text-xs text-outline uppercase tracking-widest font-bold">
                <th className="px-6 py-4 text-left">Platform</th>
                <th className="px-6 py-4 text-left">URL</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Deployed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {deployments.map((dep) => (
                <tr key={dep._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-sm">
                        {platformIcon[dep.platform] || '⬡'}
                      </span>
                      <span className="text-sm font-bold text-on-surface font-headline">
                        {dep.platform}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {dep.url ? (
                      <a
                        href={dep.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-secondary hover:underline truncate block max-w-xs"
                      >
                        {dep.url}
                      </a>
                    ) : (
                      <span className="text-sm font-mono text-outline">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${statusDot[dep.status] || 'bg-outline'} ${dep.status === 'building' ? 'animate-pulse' : ''}`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${statusColor[dep.status] || 'text-outline'}`}
                      >
                        {dep.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-outline">
                    {dep.deployedAt ? timeAgo(dep.deployedAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
