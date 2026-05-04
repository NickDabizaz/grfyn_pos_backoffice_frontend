import { useState, useMemo, useCallback } from 'react';

export function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil((items?.length || 0) / pageSize);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return (items || []).slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const goToPage = useCallback((p) => {
    setPage((prev) => {
      const safeTotal = Math.ceil((items?.length || 0) / pageSize) || 1;
      return Math.max(1, Math.min(p, safeTotal));
    });
  }, [items, pageSize]);

  const resetPage = useCallback(() => setPage(1), []);

  return { page, setPage: goToPage, totalPages, paginatedItems, resetPage };
}
