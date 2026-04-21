'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const statusColor: Record<string, string> = {
  success: 'text-tertiary',
  failure: 'text-error',
  running: 'text-secondary',
  cancelled: 'text-outline',
  pending: 'text-outline',
};

const statusDot: Record<string, string> = {
  success: 'bg-tertiary',
  failure: 'bg-error',
  running: 'bg-secondary',
  cancelled: 'bg-outline',
  pending: 'bg-outline',
};

function formatDuration(seconds: number) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function PipelinesPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pipelines
      .recent(50)
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter font-headline text-on-surface">
            Pipelines
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">CI/CD run history across all projects</p>
        </div>
        <a
          href="/settings/integrations"
          className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold font-headline uppercase tracking-widest hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all"
        >
          + Connect Repo
        </a>
      </div>

      <div className="bg-surface-container-low rounded-xl border border-outline-variant/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest font-headline text-on-surface">
            Pipeline Runs
          </span>
          <span className="text-xs font-mono text-outline px-2 py-1 bg-surface-container-highest rounded">
            {loading ? '…' : `${runs.length} runs`}
          </span>
        </div>

        {loading ? (
          <div className="px-6 py-12 text-center text-outline text-sm">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-on-surface-variant text-sm mb-4">No pipeline runs yet.</p>
            <p className="text-outline text-xs">
              Connect a GitHub or GitLab integration to start tracking runs.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-outline-variant/10">
              <tr className="text-xs text-outline uppercase tracking-widest font-bold">
                <th className="px-6 py-4 text-left">Workflow</th>
                <th className="px-6 py-4 text-left">Branch</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right">Duration</th>
                <th className="px-6 py-4 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {runs.map((run) => (
                <tr key={run._id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-medium text-sm text-on-surface font-mono">
                    {run.workflowName || run.runId}
                  </td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant font-mono">
                    {run.branch || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${statusDot[run.status] || 'bg-outline'} ${run.status === 'running' ? 'animate-pulse' : ''}`}
                      />
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${statusColor[run.status] || 'text-outline'}`}
                      >
                        {run.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-sm text-on-surface-variant">
                    {formatDuration(run.duration)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-outline">
                    {run.createdAt ? timeAgo(run.createdAt) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
