/**
 * useApi — generic data-fetching hook with loading / error state.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(getProducts, { page: 1 });
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const useApi = (apiFn, params = {}, options = {}) => {
  const { immediate = true, deps = [] } = options;

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error,   setError]   = useState(null);

  // Stringify params to use as a stable dependency
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const fetch = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams ?? paramsRef.current);
      setData(res.data);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      return null;
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiFn, ...deps]);

  useEffect(() => {
    if (immediate) fetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  return { data, loading, error, refetch: fetch };
};

export default useApi;
