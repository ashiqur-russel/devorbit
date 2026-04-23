const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('devorbit_token') || '';
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
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  mail: {
    status: () => request<{ provider: string; configured: boolean }>('/mail/status'),
    sendTest: (to?: string) =>
      request<{ id: string; to: string }>('/mail/test', {
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
  teams: {
    mine: () => request<any[]>('/teams'),
    create: (name: string) =>
      request<any>('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
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
      repoOwner?: string;
      repoName?: string;
      vercelProjectId?: string;
    }) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  },
};
