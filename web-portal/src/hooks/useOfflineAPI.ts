import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/services/offlineService';
import { api } from '@/services/api';

interface UseOfflineAPIOptions {
  enableOfflineMode?: boolean;
  retryOnReconnect?: boolean;
  cacheKey?: string;
  cacheTTL?: number;
}

interface UseOfflineAPIResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isOffline: boolean;
  pendingActionsCount: number;
}

export function useOfflineAPI<T>(
  endpoint: string,
  options: UseOfflineAPIOptions = {}
): UseOfflineAPIResult<T> {
  const {
    enableOfflineMode = true,
    retryOnReconnect = true,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    isOffline,
    pendingActionsCount,
    storeOfflineAction,
    getCache,
    setCache,
  } = useOffline();

  // Fetch data with offline support
  const fetchData = useCallback(async () => {
    if (!enableOfflineMode && isOffline) {
      setError(new Error('Offline mode disabled and no internet connection'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check cache first
      if (cacheKey) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
        }
      }

      // Fetch from API
      const response = await api.get(endpoint);
      const result = response.data;

      setData(result);

      // Cache the result
      if (cacheKey) {
        await setCache(cacheKey, result, cacheTTL);
      }
    } catch (err) {
      const error = err as Error;
      setError(error);

      // If offline and enableOfflineMode is true, try to get cached data
      if (isOffline && enableOfflineMode && cacheKey) {
        const cachedData = await getCache(cacheKey);
        if (cachedData) {
          setData(cachedData);
          setError(null); // Clear error if we have cached data
        }
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, enableOfflineMode, isOffline, cacheKey, cacheTTL, getCache, setCache]);

  // Retry on reconnect
  useEffect(() => {
    if (retryOnReconnect && !isOffline && error) {
      fetchData();
    }
  }, [isOffline, retryOnReconnect, error, fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    isOffline,
    pendingActionsCount,
  };
}

// Hook for offline mutations
export function useOfflineMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    offlineActionType: string;
    enableOfflineMode?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const {
    offlineActionType,
    enableOfflineMode = true,
    onSuccess,
    onError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { isOffline, storeOfflineAction } = useOffline();

  const mutate = useCallback(async (variables: TVariables) => {
    setLoading(true);
    setError(null);

    try {
      if (isOffline && enableOfflineMode) {
        // Store for offline processing
        const actionId = await storeOfflineAction(offlineActionType, variables);
        console.log(`Action stored for offline processing: ${actionId}`);
        
        // Simulate success for offline mode
        const mockResult = { id: actionId, ...variables } as TData;
        onSuccess?.(mockResult);
        return mockResult;
      } else {
        // Execute immediately
        const result = await mutationFn(variables);
        onSuccess?.(result);
        return result;
      }
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, isOffline, enableOfflineMode, offlineActionType, storeOfflineAction, onSuccess, onError]);

  return {
    mutate,
    loading,
    error,
  };
}

// Hook for offline-aware form submission
export function useOfflineForm<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    offlineActionType: string;
    enableOfflineMode?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
  }
) {
  const mutation = useOfflineMutation(mutationFn, options);
  const { isOffline, pendingActionsCount } = useOffline();

  const handleSubmit = useCallback(async (variables: TVariables) => {
    try {
      const result = await mutation.mutate(variables);
      return result;
    } catch (error) {
      // Error is already handled by the mutation hook
      throw error;
    }
  }, [mutation]);

  return {
    ...mutation,
    handleSubmit,
    isOffline,
    pendingActionsCount,
    isOfflineMode: isOffline && options.enableOfflineMode,
  };
}
