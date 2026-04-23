/**
 * Shared pagination contract for list endpoints (API + web).
 * Responses use `{ data, meta }` with optional aggregates (e.g. status histogram).
 */

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** Team-scoped project list: counts across the full filter (not only the current page). */
export interface ProjectTeamSummaryAggregates {
  withRepo: number;
  withVercel: number;
}

export interface ListAggregates {
  /** Counts keyed by status (or other discriminator) for the same filter as `data` / `meta.total`. */
  statusCounts?: Record<string, number>;
  /** Present when the API supports team project summary counts (e.g. `summary=1`). */
  projectSummary?: ProjectTeamSummaryAggregates;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  aggregates?: ListAggregates;
}

export type BuildPaginationMetaOptions = {
  /** Upper bound for page size (default 100). Team projects may use 200. */
  maxPageSize?: number;
};

/** Normalize paging inputs and compute meta aligned with skip/limit queries. */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
  opts?: BuildPaginationMetaOptions,
): PaginationMeta {
  const cap = opts?.maxPageSize ?? 100;
  const safePageSize = Math.max(1, Math.min(Math.floor(Number(pageSize)) || 20, cap));
  const totalPages = total === 0 ? 0 : Math.ceil(total / safePageSize);
  const requested = Math.floor(Number(page)) || 1;
  const safePage = totalPages === 0 ? 1 : Math.min(Math.max(1, requested), totalPages);

  return {
    page: safePage,
    pageSize: safePageSize,
    total,
    totalPages,
    hasNextPage: totalPages > 0 && safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}

/** Skip value to use with `.skip()` for offset pagination (uses clamped page from meta). */
export function paginationSkip(meta: PaginationMeta): number {
  if (meta.total === 0 || meta.totalPages === 0) return 0;
  return (meta.page - 1) * meta.pageSize;
}
