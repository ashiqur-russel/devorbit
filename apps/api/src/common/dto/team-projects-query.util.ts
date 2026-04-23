import type { TeamProjectsQueryDto } from './team-projects-query.dto';

export type NormalizedTeamProjectsQuery = {
  page: number;
  limit: number;
  summary: boolean;
};

export function normalizeTeamProjectsQuery(query: TeamProjectsQueryDto): NormalizedTeamProjectsQuery {
  const rawPage = query.page;
  const rawLimit = query.limit;
  const page = rawPage != null && Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const limit = rawLimit != null && Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(200, Math.floor(rawLimit)) : 20;
  return {
    page,
    limit,
    summary: query.summary === '1',
  };
}
