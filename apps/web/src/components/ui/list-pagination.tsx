'use client';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

function pageItems(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1, current - 2, current + 2]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const out: (number | 'ellipsis')[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    const prev = sorted[i - 1];
    if (i > 0 && p - prev > 1) out.push('ellipsis');
    out.push(p);
  }
  return out;
}

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
  className?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = total === 0 ? 0 : Math.min(total, safePage * pageSize);

  if (total === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-t border-outline-variant/10 bg-surface-container-low/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6',
        className,
      )}
    >
      <p className="text-center text-xs text-on-surface-variant sm:text-left">
        Showing <span className="font-mono text-on-surface">{start}</span>–<span className="font-mono text-on-surface">{end}</span> of{' '}
        <span className="font-mono text-on-surface">{total}</span>
      </p>

      {totalPages > 1 ? (
        <Pagination className="mx-0 w-auto justify-center sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                disabled={safePage <= 1}
                onClick={() => safePage > 1 && onPageChange(safePage - 1)}
              />
            </PaginationItem>

            {pageItems(safePage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink isActive={item === safePage} onClick={() => onPageChange(item)}>
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                disabled={safePage >= totalPages}
                onClick={() => safePage < totalPages && onPageChange(safePage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}
