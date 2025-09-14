import { QueryClient } from '@tanstack/react-query';
import { LocalCacheManager, CACHE_KEYS, CACHE_TIMES, STALE_TIMES, INVALIDATION_PATTERNS } from '@/utils/cacheManager';
import { ordersAPI, deliveriesAPI, usersAPI, notificationsAPI } from './api';

class CacheAwareAPIService {
  private queryClient: QueryClient;
  private localCache: LocalCacheManager;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.localCache = LocalCacheManager.getInstance();
  }

  // Orders API with caching
  async getOrders(params: any = {}) {
    const cacheKey = `orders_${JSON.stringify(params)}`;
    
    // Try local cache first
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API
    const response = await ordersAPI.getOrders(params);
    
    // Cache the response
    this.localCache.set(cacheKey, response, CACHE_TIMES.MEDIUM);
    
    return response;
  }

  async getOrderDetails(orderId: string) {
    const cacheKey = `order_details_${orderId}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await ordersAPI.getOrderDetails(orderId);
    this.localCache.set(cacheKey, response, CACHE_TIMES.MEDIUM);
    
    return response;
  }

  async createOrder(orderData: any) {
    const response = await ordersAPI.createOrder(orderData);
    
    // Invalidate related caches
    this.invalidateOrderCaches();
    
    return response;
  }

  async updateOrder(orderId: string, orderData: any) {
    const response = await ordersAPI.updateOrder(orderId, orderData);
    
    // Invalidate related caches
    this.invalidateOrderCaches();
    
    return response;
  }

  // Deliveries API with caching
  async getDeliveries(params: any = {}) {
    const cacheKey = `deliveries_${JSON.stringify(params)}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await deliveriesAPI.getDeliveries(params);
    this.localCache.set(cacheKey, response, CACHE_TIMES.MEDIUM);
    
    return response;
  }

  async getDeliveryDetails(deliveryId: string) {
    const cacheKey = `delivery_details_${deliveryId}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await deliveriesAPI.getDeliveryDetails(deliveryId);
    this.localCache.set(cacheKey, response, CACHE_TIMES.MEDIUM);
    
    return response;
  }

  async updateDeliveryStatus(deliveryId: string, status: string) {
    const response = await deliveriesAPI.updateDeliveryStatus(deliveryId, status);
    
    // Invalidate related caches
    this.invalidateDeliveryCaches();
    
    return response;
  }

  // Users API with caching
  async getUsers(params: any = {}) {
    const cacheKey = `users_${JSON.stringify(params)}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await usersAPI.getUsers(params);
    this.localCache.set(cacheKey, response, CACHE_TIMES.LONG);
    
    return response;
  }

  async getUserDetails(userId: string) {
    const cacheKey = `user_details_${userId}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await usersAPI.getUserDetails(userId);
    this.localCache.set(cacheKey, response, CACHE_TIMES.LONG);
    
    return response;
  }

  // Notifications API with caching
  async getNotifications(params: any = {}) {
    const cacheKey = `notifications_${JSON.stringify(params)}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await notificationsAPI.getNotifications(params);
    this.localCache.set(cacheKey, response, CACHE_TIMES.SHORT);
    
    return response;
  }

  async getUnreadCount() {
    const cacheKey = 'unread_count';
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const response = await notificationsAPI.getUnreadCount();
    this.localCache.set(cacheKey, response, CACHE_TIMES.SHORT);
    
    return response;
  }

  // Dashboard data with caching
  async getDashboardStats(userRole: string) {
    const cacheKey = `dashboard_stats_${userRole}`;
    
    const cachedData = this.localCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dashboard data based on user role
    let stats;
    if (userRole === 'ADMIN') {
      const [ordersRes, deliveriesRes, usersRes, notificationsRes] = await Promise.all([
        this.getOrders({ limit: 1000 }),
        this.getDeliveries({ limit: 1000 }),
        this.getUsers({ limit: 1000 }),
        this.getUnreadCount()
      ]);

      const orders = ordersRes.data;
      const deliveries = deliveriesRes.data;
      const users = usersRes.data;

      stats = {
        totalOrders: orders.length,
        pendingOrders: orders.filter((o: any) => o.status === 'PENDING').length,
        inProgressOrders: orders.filter((o: any) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length,
        completedOrders: orders.filter((o: any) => o.status === 'DELIVERED').length,
        totalDeliveries: deliveries.length,
        activeDeliveries: deliveries.filter((d: any) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
        totalUsers: users.length,
        totalDrivers: users.filter((u: any) => u.role === 'DRIVER').length,
        totalBusiness: users.filter((u: any) => u.role === 'BUSINESS').length,
        unreadNotifications: notificationsRes.data.count || 0,
      };
    } else if (userRole === 'DRIVER') {
      const [deliveriesRes, notificationsRes] = await Promise.all([
        this.getDeliveries({ limit: 1000 }),
        this.getUnreadCount()
      ]);

      const driverDeliveries = deliveriesRes.data.filter((d: any) => d.driverId === 'current_user_id');

      stats = {
        totalDeliveries: driverDeliveries.length,
        activeDeliveries: driverDeliveries.filter((d: any) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
        completedDeliveries: driverDeliveries.filter((d: any) => d.status === 'DELIVERED').length,
        unreadNotifications: notificationsRes.data.count || 0,
      };
    } else if (userRole === 'BUSINESS') {
      const [ordersRes, deliveriesRes, notificationsRes] = await Promise.all([
        this.getOrders({ limit: 1000 }),
        this.getDeliveries({ limit: 1000 }),
        this.getUnreadCount()
      ]);

      const businessOrders = ordersRes.data; // Filter by business if needed
      const businessDeliveries = deliveriesRes.data; // Filter by business if needed

      stats = {
        totalOrders: businessOrders.length,
        pendingOrders: businessOrders.filter((o: any) => o.status === 'PENDING').length,
        activeDeliveries: businessDeliveries.filter((d: any) => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(d.status)).length,
        completedOrders: businessOrders.filter((o: any) => o.status === 'DELIVERED').length,
        unreadNotifications: notificationsRes.data.count || 0,
      };
    } else {
      // Customer role
      const [ordersRes, notificationsRes] = await Promise.all([
        this.getOrders({ limit: 1000 }),
        this.getUnreadCount()
      ]);

      const customerOrders = ordersRes.data; // Filter by customer if needed

      stats = {
        totalOrders: customerOrders.length,
        pendingOrders: customerOrders.filter((o: any) => o.status === 'PENDING').length,
        completedOrders: customerOrders.filter((o: any) => o.status === 'DELIVERED').length,
        unreadNotifications: notificationsRes.data.count || 0,
      };
    }

    this.localCache.set(cacheKey, stats, CACHE_TIMES.MEDIUM);
    return { data: stats };
  }

  // Cache invalidation methods
  private invalidateOrderCaches() {
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.ORDERS] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.RECENT_ORDERS] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DASHBOARD_STATS] });
    
    // Clear local cache
    this.localCache.remove('orders_');
    this.localCache.remove('order_details_');
    this.localCache.remove('dashboard_stats_');
  }

  private invalidateDeliveryCaches() {
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DELIVERIES] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.ACTIVE_DELIVERIES] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DASHBOARD_STATS] });
    
    // Clear local cache
    this.localCache.remove('deliveries_');
    this.localCache.remove('delivery_details_');
    this.localCache.remove('dashboard_stats_');
  }

  private invalidateUserCaches() {
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.USERS] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DRIVERS] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DASHBOARD_STATS] });
    
    // Clear local cache
    this.localCache.remove('users_');
    this.localCache.remove('user_details_');
    this.localCache.remove('drivers_');
    this.localCache.remove('driver_details_');
  }

  private invalidateNotificationCaches() {
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.RECENT_NOTIFICATIONS] });
    this.queryClient.invalidateQueries({ queryKey: [CACHE_KEYS.DASHBOARD_STATS] });
    
    // Clear local cache
    this.localCache.remove('notifications_');
    this.localCache.remove('unread_count');
  }

  // Public cache management methods
  clearAllCaches() {
    this.localCache.clear();
    this.queryClient.clear();
  }

  getCacheStats() {
    return this.localCache.getStats();
  }

  // Prefetch methods for better UX
  async prefetchUserData(userId: string) {
    await Promise.all([
      this.queryClient.prefetchQuery({
        queryKey: [CACHE_KEYS.USER_DETAILS, userId],
        queryFn: () => this.getUserDetails(userId),
        staleTime: STALE_TIMES.LONG,
      }),
      this.queryClient.prefetchQuery({
        queryKey: [CACHE_KEYS.USER_PREFERENCES],
        queryFn: () => this.localCache.get('user_preferences') || {},
        staleTime: STALE_TIMES.STATIC,
      }),
    ]);
  }

  async prefetchDashboardData(userRole: string) {
    await this.queryClient.prefetchQuery({
      queryKey: [CACHE_KEYS.DASHBOARD_STATS, userRole],
      queryFn: () => this.getDashboardStats(userRole),
      staleTime: STALE_TIMES.MODERATE,
    });
  }
}

export default CacheAwareAPIService;
