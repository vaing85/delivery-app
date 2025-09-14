import { QueryClient } from '@tanstack/react-query';

// Cache configuration
export const CACHE_KEYS = {
  // User data
  USER_PROFILE: 'user-profile',
  USER_PREFERENCES: 'user-preferences',
  
  // Orders
  ORDERS: 'orders',
  ORDER_DETAILS: 'order-details',
  RECENT_ORDERS: 'recent-orders',
  
  // Deliveries
  DELIVERIES: 'deliveries',
  DELIVERY_DETAILS: 'delivery-details',
  ACTIVE_DELIVERIES: 'active-deliveries',
  
  // Users & Drivers
  USERS: 'users',
  DRIVERS: 'drivers',
  DRIVER_DETAILS: 'driver-details',
  
  // Dashboard
  DASHBOARD_STATS: 'dashboard-stats',
  ORDER_TRENDS: 'order-trends',
  RECENT_NOTIFICATIONS: 'recent-notifications',
  
  // Analytics
  ANALYTICS_DATA: 'analytics-data',
  ROUTE_OPTIMIZATION: 'route-optimization',
} as const;

// Cache time configurations (in milliseconds)
export const CACHE_TIMES = {
  // Short-lived data (5 minutes)
  SHORT: 5 * 60 * 1000,
  
  // Medium-lived data (15 minutes)
  MEDIUM: 15 * 60 * 1000,
  
  // Long-lived data (1 hour)
  LONG: 60 * 60 * 1000,
  
  // Very long-lived data (24 hours)
  VERY_LONG: 24 * 60 * 60 * 1000,
  
  // Static data (1 week)
  STATIC: 7 * 24 * 60 * 60 * 1000,
} as const;

// Stale time configurations
export const STALE_TIMES = {
  // Real-time data (1 minute)
  REALTIME: 1 * 60 * 1000,
  
  // Frequently updated data (5 minutes)
  FREQUENT: 5 * 60 * 1000,
  
  // Moderately updated data (15 minutes)
  MODERATE: 15 * 60 * 1000,
  
  // Rarely updated data (1 hour)
  RARE: 60 * 60 * 1000,
  
  // Static data (24 hours)
  STATIC: 24 * 60 * 60 * 1000,
} as const;

// Cache invalidation patterns
export const INVALIDATION_PATTERNS = {
  // When order is created/updated
  ORDER_CHANGED: [CACHE_KEYS.ORDERS, CACHE_KEYS.RECENT_ORDERS, CACHE_KEYS.DASHBOARD_STATS],
  
  // When delivery is created/updated
  DELIVERY_CHANGED: [CACHE_KEYS.DELIVERIES, CACHE_KEYS.ACTIVE_DELIVERIES, CACHE_KEYS.DASHBOARD_STATS],
  
  // When user profile is updated
  USER_CHANGED: [CACHE_KEYS.USER_PROFILE, CACHE_KEYS.USER_PREFERENCES],
  
  // When driver status changes
  DRIVER_CHANGED: [CACHE_KEYS.DRIVERS, CACHE_KEYS.DRIVER_DETAILS, CACHE_KEYS.ACTIVE_DELIVERIES],
  
  // When notification is received
  NOTIFICATION_CHANGED: [CACHE_KEYS.RECENT_NOTIFICATIONS, CACHE_KEYS.DASHBOARD_STATS],
} as const;

// Local storage cache manager
export class LocalCacheManager {
  private static instance: LocalCacheManager;
  private cachePrefix = 'delivery_app_cache_';
  private maxCacheSize = 10 * 1024 * 1024; // 10MB

  private constructor() {}

  static getInstance(): LocalCacheManager {
    if (!LocalCacheManager.instance) {
      LocalCacheManager.instance = new LocalCacheManager();
    }
    return LocalCacheManager.instance;
  }

  set(key: string, data: any, ttl: number = CACHE_TIMES.MEDIUM): void {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      const serialized = JSON.stringify(cacheItem);
      
      // Check cache size before storing
      if (this.getCacheSize() + serialized.length > this.maxCacheSize) {
        this.cleanup();
      }

      localStorage.setItem(this.cachePrefix + key, serialized);
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  get(key: string): any | null {
    try {
      const cached = localStorage.getItem(this.cachePrefix + key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if expired
      if (Date.now() > cacheItem.expiresAt) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Failed to retrieve cached data:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.cachePrefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  private getCacheSize(): number {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        size += localStorage.getItem(key)?.length || 0;
      }
    });
    return size;
  }

  private cleanup(): void {
    const keys = Object.keys(localStorage);
    const cacheItems: Array<{ key: string; timestamp: number }> = [];

    // Collect all cache items with timestamps
    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheItem = JSON.parse(cached);
            cacheItems.push({
              key: key.replace(this.cachePrefix, ''),
              timestamp: cacheItem.timestamp || 0
            });
          }
        } catch (error) {
          // Remove corrupted cache items
          localStorage.removeItem(key);
        }
      }
    });

    // Sort by timestamp (oldest first)
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of items
    const itemsToRemove = Math.floor(cacheItems.length * 0.25);
    for (let i = 0; i < itemsToRemove; i++) {
      this.remove(cacheItems[i].key);
    }
  }

  // Get cache statistics
  getStats(): { size: number; items: number; oldestItem?: number; newestItem?: number } {
    const keys = Object.keys(localStorage);
    let size = 0;
    let items = 0;
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    keys.forEach(key => {
      if (key.startsWith(this.cachePrefix)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheItem = JSON.parse(cached);
            size += cached.length;
            items++;
            
            const timestamp = cacheItem.timestamp || 0;
            if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
            if (timestamp > newestTimestamp) newestTimestamp = timestamp;
          }
        } catch (error) {
          // Skip corrupted items
        }
      }
    });

    return {
      size,
      items,
      oldestItem: oldestTimestamp === Infinity ? undefined : oldestTimestamp,
      newestItem: newestTimestamp === 0 ? undefined : newestTimestamp
    };
  }
}

// Enhanced Query Client with better caching
export const createEnhancedQueryClient = (): QueryClient => {
  const localCache = LocalCacheManager.getInstance();

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.response?.status >= 400 && error?.response?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        // Stale time - how long data is considered fresh
        staleTime: STALE_TIMES.MODERATE,
        
        // Cache time - how long data stays in cache after last use
        gcTime: CACHE_TIMES.LONG,
        
        // Refetch configuration
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        
        // Network mode
        networkMode: 'online',
        
        // Placeholder data
        placeholderData: (previousData) => previousData,
        
        // Query function with local cache integration
        queryFn: async ({ queryKey, meta }) => {
          const cacheKey = Array.isArray(queryKey) ? queryKey.join('_') : String(queryKey);
          
          // Try to get from local cache first
          const cachedData = localCache.get(cacheKey);
          if (cachedData && meta?.useCache !== false) {
            return cachedData;
          }
          
          // If no cached data, the actual query function should be provided
          throw new Error('Query function not provided');
        },
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        
        // Network mode
        networkMode: 'online',
      },
    },
  });
};

// Cache invalidation utilities
export const invalidateCache = (queryClient: QueryClient, patterns: string[]): void => {
  patterns.forEach(pattern => {
    queryClient.invalidateQueries({ queryKey: [pattern] });
  });
};

// Prefetch utilities
export const prefetchData = async (
  queryClient: QueryClient,
  queryKey: string[],
  queryFn: () => Promise<any>,
  options?: { staleTime?: number; cacheTime?: number }
): Promise<void> => {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime || STALE_TIMES.MODERATE,
    gcTime: options?.cacheTime || CACHE_TIMES.LONG,
  });
};

export default LocalCacheManager;
