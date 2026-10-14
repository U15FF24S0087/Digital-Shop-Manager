import { useState, useCallback } from 'react';

/**
 * usePagination — manages page, limit, search and filter state.
 * Returns params object ready to spread into API calls.
 */
const usePagination = (defaults = {}) => {
  const [page,   setPage]   = useState(defaults.page   ?? 1);
  const [limit,  setLimit]  = useState(defaults.limit  ?? 20);
  const [search, setSearch] = useState(defaults.search ?? '');
  const [filters, setFilters] = useState(defaults.filters ?? {});

  const params = { page, limit, ...(search && { search }), ...filters };

  const goToPage   = useCallback((p) => setPage(p), []);
  const changeLimit = useCallback((l) => { setLimit(l); setPage(1); }, []);

  const handleSearch = useCallback((val) => {
    setSearch(val);
    setPage(1);
  }, []);

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilters({});
    setPage(1);
  }, []);

  return { page, limit, search, filters, params, goToPage, changeLimit, handleSearch, setFilter, resetFilters };
};

export default usePagination;
