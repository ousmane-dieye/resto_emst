import { useState, useCallback } from 'react';

export const useFetch = (fetchFn) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};

export const useFetchMultiple = (fetchFns) => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  const executeAll = useCallback(async () => {
    setLoading(true);
    setErrors({});
    
    try {
      const promises = fetchFns.map(async (fn, index) => {
        try {
          const data = await fn();
          return [index, data];
        } catch (err) {
          return [index, null, err.message];
        }
      });

      const settled = await Promise.all(promises);
      
      const newResults = {};
      const newErrors = {};
      
      settled.forEach(([index, data, err]) => {
        if (err) {
          newErrors[index] = err;
        } else {
          newResults[index] = data;
        }
      });

      setResults(newResults);
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  }, [fetchFns]);

  return { results, errors, loading, executeAll };
};

export default useFetch;