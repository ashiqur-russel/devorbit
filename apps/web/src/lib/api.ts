const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('devorbit_token') || '';
}

function parseErrorMessage(path: string, res: Response, body: unknown): string {
  let msg = `API ${res.status}: ${path}`;
  if (body && typeof body === 'object' && 'message' in body) {
    const m = (body as { message: unknown }).message;
    if (typeof m === 'string') return m;
    if (Array.isArray(m)) return m.map(String).join(', ');
  }
  return msg;
}

async function readJsonOrText(res: Response): Promise<unknown> {
  const raw = await res.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(parseErrorMessage(path, res, body));
  return body as T;
}

/** Login/register — do not attach JWT. */
async function requestPublic<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const body = await readJsonOrText(res);
  if (!res.ok) throw new Error(parseErrorMessage(path, res, body));
  return body as T;
}

export const api = {
  auth: {
    register: (body: {
      email: string;
      password: string;
      organizationName?: string;
      inviteToken?: string;
      displayName?: string;
    }) =>
      requestPublic<{ token: string; organizationId: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    loginEmail: (email: string, password: string) =>
      requestPublic<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ _id: string; email?: string; name?: string }>('/auth/me'),
  },
  mail: {
    status: () => request<{ provider: 'gmail' | 'resend' | 'none'; configured: boolean }>('/mail/status'),
    sendTest: (to?: string) =>
      request<{ id: string; to: string; via: 'gmail' | 'resend' }>('/mail/test', {
        method: 'POST',
        body: JSON.stringify(to ? { to } : {}),
      }),
  },
  pipelines: {
    recentByTeam: (teamId: string, limit = 50) =>
      request<any[]>(`/pipelines/team/${teamId}/recent?limit=${limit}`),
    byProject: (projectId: string) => request<any[]>(`/pipelines/project/${projectId}`),
  },
  deployments: {
    recentByTeam: (teamId: string, limit = 50) =>
      request<any[]>(`/deployments/team/${teamId}/recent?limit=${limit}`),
    byProject: (projectId: string) => request<any[]>(`/deployments/project/${projectId}`),
  },
  invitations: {
    preview: (token: string) =>
      requestPublic<{
        organizationId: string;
        email: string;
        organizationName: string;
        organizationSlug: string;
        teamName: string | null;
      }>(`/invitations/preview/${encodeURIComponent(token)}`),
  },
  organizations: {
    mine: () => request<any[]>('/organizations'),
    myProvisioning: () =>
      request<{
        canCreateTeams: boolean;
        canInstallAgent: boolean;
        hasAnyOrganization: boolean;
      }>('/organizations/me/provisioning'),
    create: (name: string) =>
      request<any>('/organizations', { method: 'POST', body: JSON.stringify({ name }) }),
    dashboard: (orgId: string) => request<any>(`/organizations/${orgId}/dashboard`),
    setAdminCapabilities: (
      orgId: string,
      body: { email: string; canCreateTeams: boolean; canInstallAgent: boolean },
    ) =>
      request<{ ok: boolean; userId: string; canCreateTeams: boolean; canInstallAgent: boolean }>(
        `/organizations/${orgId}/admin-capabilities`,
        { method: 'POST', body: JSON.stringify(body) },
      ),
    createInvite: (orgId: string, body: { email: string; teamId?: string }) =>
      request<{
        token: string;
        registerUrl: string;
        email: string;
        expiresAt: string;
        mailConfigured: boolean;
        mailSent: boolean;
        mailError?: string;
      }>(`/organizations/${orgId}/invites`, { method: 'POST', body: JSON.stringify(body) }),
    addTeamMember: (orgId: string, teamId: string, email: string) =>
      request<{ ok: boolean }>(`/organizations/${orgId}/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    promoteAdmin: (orgId: string, email: string) =>
      request<{ ok: boolean }>(`/organizations/${orgId}/admins`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },
  teams: {
    mine: () => request<any[]>('/teams'),
    create: (name: string, organizationId: string) =>
      request<any>('/teams', {
        method: 'POST',
        body: JSON.stringify({ name, organizationId }),
      }),
  },
  servers: {
    byTeam: (teamId: string) => request<any[]>(`/servers/team/${teamId}`),
    get: (id: string) => request<any>(`/servers/${id}`),
    register: (teamId: string, name: string) =>
      request<any>('/servers', { method: 'POST', body: JSON.stringify({ teamId, name }) }),
  },
  metrics: {
    recent: (serverId: string, minutes = 15) =>
      request<any[]>(`/metrics/${serverId}?minutes=${minutes}`),
    latest: (serverId: string) => request<any>(`/metrics/${serverId}/latest`),
  },
  integrations: {
    list: (teamId: string) => request<any[]>(`/integrations/team/${teamId}`),
    connect: (teamId: string, provider: string, token: string) =>
      request('/integrations', {
        method: 'POST',
        body: JSON.stringify({ teamId, provider, token }),
      }),
    disconnect: (teamId: string, provider: string) =>
      request(`/integrations/${teamId}/${provider}`, { method: 'DELETE' }),
  },
  projects: {
    byTeam: (teamId: string) => request<any[]>(`/projects/team/${teamId}`),
    create: (data: {
      teamId: string;
      name: string;
      repoProvider?: 'GITHUB' | 'GITLAB';
      repoOwner?: string;
      repoName?: string;
      vercelProjectId?: string;
    }) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
    remove: (projectId: string) => request<{ ok: true }>(`/projects/${projectId}`, { method: 'DELETE' }),
  },
};
