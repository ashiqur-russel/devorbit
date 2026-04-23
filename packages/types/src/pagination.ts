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

export interface ListAggregates {
  /** Counts keyed by status (or other discriminator) for the same filter as `data` / `meta.total`. */
  statusCounts?: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  aggregates?: ListAggregates;
}

/** Normalize paging inputs and compute meta aligned with skip/limit queries. */
export function buildPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  const safePageSize = Math.max(1, Math.min(Math.floor(Number(pageSize)) || 20, 100));
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
