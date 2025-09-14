import { QueryClient } from '@tanstack/react-query';
import { debounce, throttle } from 'lodash-es';

interface APIOptimizerConfig {
  debounceDelay: number;
  throttleDelay: number;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  staleTime: number;
  cacheTime: number;
}

class APIOptimizer {
  private queryClient: QueryClient;
  private config: APIOptimizerConfig;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;

  constructor(queryClient: QueryClient, config: Partial<APIOptimizerConfig> = {}) {
    this.queryClient = queryClient;
    this.config = {
      debounceDelay: 300,
      throttleDelay: 1000,
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 10,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      ...config,
    };
  }

  // Request deduplication
  async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  // Request batching
  async batchRequests<T>(
    requests: Array<() => Promise<T>>,
    batchKey: string
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const results = await Promise.all(requests.map(req => req()));
          resolve(results);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const batch = this.requestQueue.splice(0, this.config.batchSize);
      await Promise.all(batch.map(request => request()));
    }

    this.isProcessingQueue = false;
  }

  // Debounced requests
  createDebouncedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    delay: number = this.config.debounceDelay
  ): () => Promise<T> {
    return debounce(async () => {
      return this.deduplicateRequest(key, requestFn);
    }, delay);
  }

  // Throttled requests
  createThrottledRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    delay: number = this.config.throttleDelay
  ): () => Promise<T> {
    return throttle(async () => {
      return this.deduplicateRequest(key, requestFn);
    }, delay);
  }

  // Smart prefetching
  async prefetchRelatedData<T>(
    baseQueryKey: string[],
    relatedQueries: Array<{
      key: string[];
      queryFn: () => Promise<T>;
      staleTime?: number;
    }>
  ): Promise<void> {
    const prefetchPromises = relatedQueries.map(({ key, queryFn, staleTime }) =>
      this.queryClient.prefetchQuery({
        queryKey: key,
        queryFn,
        staleTime: staleTime || this.config.staleTime,
      })
    );

    await Promise.all(prefetchPromises);
  }

  // Background refetching
  enableBackgroundRefetch(queryKey: string[]): void {
    this.queryClient.setQueryData(queryKey, (oldData: any) => {
      if (oldData) {
        // Mark data as stale to trigger background refetch
        this.queryClient.invalidateQueries({ queryKey, exact: true });
      }
      return oldData;
    });
  }

  // Request cancellation
  createCancellableRequest<T>(
    key: string,
    requestFn: (signal: AbortSignal) => Promise<T>
  ): { request: () => Promise<T>; cancel: () => void } {
    let abortController: AbortController | null = null;

    const request = async (): Promise<T> => {
      abortController = new AbortController();
      return requestFn(abortController.signal);
    };

    const cancel = () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    };

    return { request, cancel };
  }

  // Optimized query configuration
  getOptimizedQueryConfig<T>(baseConfig: any = {}) {
    return {
      staleTime: this.config.staleTime,
      cacheTime: this.config.cacheTime,
      retry: (failureCount: number, error: any) => {
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false; // Don't retry client errors
        }
        return failureCount < this.config.maxRetries;
      },
      retryDelay: (attemptIndex: number) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
      ...baseConfig,
    };
  }

  // Memory management
  clearOldCache(): void {
    const now = Date.now();
    const maxAge = this.config.cacheTime;

    // This would need to be implemented based on your cache structure
    // For now, we'll just clear queries older than cacheTime
    this.queryClient.getQueryCache().findAll().forEach(query => {
      if (query.state.dataUpdatedAt && now - query.state.dataUpdatedAt > maxAge) {
        this.queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
  }

  // Performance monitoring
  getPerformanceMetrics(): {
    pendingRequests: number;
    queueLength: number;
    cacheSize: number;
  } {
    return {
      pendingRequests: this.pendingRequests.size,
      queueLength: this.requestQueue.length,
      cacheSize: this.queryClient.getQueryCache().getAll().length,
    };
  }
}

// Hook for API optimization
export const useAPIOptimizer = (queryClient: QueryClient) => {
  const optimizer = new APIOptimizer(queryClient);

  return {
    deduplicateRequest: optimizer.deduplicateRequest.bind(optimizer),
    batchRequests: optimizer.batchRequests.bind(optimizer),
    createDebouncedRequest: optimizer.createDebouncedRequest.bind(optimizer),
    createThrottledRequest: optimizer.createThrottledRequest.bind(optimizer),
    prefetchRelatedData: optimizer.prefetchRelatedData.bind(optimizer),
    enableBackgroundRefetch: optimizer.enableBackgroundRefetch.bind(optimizer),
    createCancellableRequest: optimizer.createCancellableRequest.bind(optimizer),
    getOptimizedQueryConfig: optimizer.getOptimizedQueryConfig.bind(optimizer),
    clearOldCache: optimizer.clearOldCache.bind(optimizer),
    getPerformanceMetrics: optimizer.getPerformanceMetrics.bind(optimizer),
  };
};

// Request interceptor for optimization
export const createOptimizedAPI = (baseAPI: any, queryClient: QueryClient) => {
  const optimizer = new APIOptimizer(queryClient);

  return new Proxy(baseAPI, {
    get(target, prop) {
      const originalMethod = target[prop];
      
      if (typeof originalMethod === 'function') {
        return async (...args: any[]) => {
          const requestKey = `${String(prop)}_${JSON.stringify(args)}`;
          
          return optimizer.deduplicateRequest(requestKey, () => 
            originalMethod.apply(target, args)
          );
        };
      }
      
      return originalMethod;
    }
  });
};

export default APIOptimizer;
