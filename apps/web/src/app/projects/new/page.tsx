'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useTeamId } from '@/hooks/use-team-id';

type RepoProvider = 'GITHUB' | 'GITLAB';

function NewProjectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { teamId, loading: teamLoading } = useTeamId();

  const [name, setName] = useState('');
  const [repoProvider, setRepoProvider] = useState<RepoProvider>('GITHUB');
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const owner = searchParams.get('owner')?.trim() || '';
    const repo = searchParams.get('repo')?.trim() || '';
    const provider = (searchParams.get('provider')?.trim().toUpperCase() || '') as RepoProvider | '';
    const suggestedName = searchParams.get('name')?.trim() || '';

    if (provider === 'GITLAB' || provider === 'GITHUB') setRepoProvider(provider);
    if (owner) setRepoOwner(owner);
    if (repo) setRepoName(repo);
    if (suggestedName) setName(suggestedName);
    if (!suggestedName && (owner || repo)) setName(`${owner || ''}${owner && repo ? '/' : ''}${repo || ''}`.trim());
  }, [searchParams]);

  const repoHint = useMemo(() => {
    if (!repoOwner || !repoName) return '';
    return `${repoProvider === 'GITLAB' ? 'gitlab.com' : 'github.com'}/${repoOwner}/${repoName}`;
  }, [repoOwner, repoName, repoProvider]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!teamId) return;
    if (!name.trim()) {
      setError('Project name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.projects.create({
        teamId,
        name: name.trim(),
        repoProvider,
        repoOwner: repoOwner.trim() || undefined,
        repoName: repoName.trim() || undefined,
        vercelProjectId: vercelProjectId.trim() || undefined,
      });
      router.replace('/pipelines');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          href="/projects"
          className="text-xs font-bold uppercase tracking-widest text-outline hover:text-primary"
        >
          ← Projects
        </Link>
        <h1 className="mt-2 font-headline text-4xl font-black tracking-tighter text-on-surface">New project</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Link a repo so Devorbit can pull GitHub Actions runs into Pipelines. For your private repo{' '}
          <span className="font-mono text-xs text-on-surface">amuvee/amuvee</span>, set owner <strong>amuvee</strong> and
          repo <strong>amuvee</strong>.
        </p>
      </div>

      {!teamLoading && !teamId && (
        <div className="rounded-xl border border-error/25 bg-error/5 px-5 py-4 text-sm text-error">
          No team found.{' '}
          <Link href="/onboarding/step-1" className="font-bold underline">
            Complete onboarding
          </Link>{' '}
          first.
        </div>
      )}

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-outline">Project name</label>
          <input
            className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            placeholder="amuvee"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo provider</label>
            <select
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={repoProvider}
              onChange={(e) => setRepoProvider(e.target.value as RepoProvider)}
            >
              <option value="GITHUB">GitHub</option>
              <option value="GITLAB">GitLab</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo owner</label>
            <input
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={repoOwner}
              onChange={(e) => setRepoOwner(e.target.value)}
              placeholder="amuvee"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-outline">Repo name</label>
            <input
              className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="amuvee"
            />
          </div>
        </div>

        {repoHint ? <p className="text-xs text-on-surface-variant font-mono">{repoHint}</p> : null}

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-outline">Vercel project id (optional)</label>
          <input
            className="mt-1 w-full rounded-lg border border-outline-variant/20 bg-surface-container-high px-3 py-2.5 text-sm"
            value={vercelProjectId}
            onChange={(e) => setVercelProjectId(e.target.value)}
            placeholder="prj_xxxxx"
          />
        </div>

        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 text-xs text-on-surface-variant space-y-2">
          <p className="font-bold uppercase tracking-widest text-outline">Important (private repo)</p>
          <p>
            Your GitHub integration token must be able to read Actions runs for this repo. In{' '}
            <Link href="/settings/integrations" className="text-primary underline">
              Settings → Integrations
            </Link>
            , use a GitHub PAT with at least <strong className="text-on-surface">Actions: read</strong> and{' '}
            <strong className="text-on-surface">Contents: read/metadata</strong> for the repo.
          </p>
          <p>
            Sync runs in the background every ~5 minutes. After creating this project, check Pipelines and wait a bit if
            it’s still empty.
          </p>
        </div>

        {error && <p className="text-sm text-error font-mono">{error}</p>}

        <button
          type="submit"
          disabled={!teamId || saving}
          className="w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
        >
          {saving ? 'Creating…' : 'Create project'}
        </button>
      </form>
    </div>
  );
}

export default function NewProjectPage() {
  return (
    <Suspense
      fallback={<div className="text-sm text-outline">Loading…</div>}
    >
      <NewProjectInner />
    </Suspense>
  );
}

