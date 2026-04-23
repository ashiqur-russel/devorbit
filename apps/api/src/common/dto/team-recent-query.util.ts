import type { TeamRecentQueryDto } from './team-recent-query.dto';

export type NormalizedTeamRecentQuery = {
  page: number;
  limit: number;
  projectId?: string;
  statusCounts: boolean;
};

export function normalizeTeamRecentQuery(query: TeamRecentQueryDto): NormalizedTeamRecentQuery {
  const rawPage = query.page;
  const rawLimit = query.limit;
  const page = rawPage != null && Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit = rawLimit != null && Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(100, Math.floor(rawLimit)) : 20;
  return {
    page,
    limit,
    projectId: query.projectId,
    statusCounts: query.statusCounts === '1',
  };
}
