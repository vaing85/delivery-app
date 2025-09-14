import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-toastify';

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000'),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage directly
    const token = localStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          // Use the full URL for refresh
          const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:5000');
          const response = await axios.post(`${baseURL}/api/auth/refresh`, {
            refreshToken
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data) {
      toast.error((error.response.data as any).message);
    } else if (error.message) {
      toast.error(error.message);
    }

    return Promise.reject(error);
  }
);

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse>('/api/auth/login', {
      email,
      password
    });
    return response.data;
  },

  register: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/auth/register', userData);
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post<ApiResponse>('/api/auth/refresh', {
      refreshToken
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post<ApiResponse>('/api/auth/logout');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/api/auth/forgot-password', {
      email
    });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post<ApiResponse>('/api/auth/reset-password', {
      token,
      newPassword
    });
    return response.data;
  }
};

// Users API
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    try {
      // Try to get full user list (admin only)
      const response = await api.get<ApiResponse>('/api/users', { params });
      return response.data;
    } catch (error: any) {
      // If admin access fails, fall back to basic user info
      if (error.response?.status === 403) {
        const basicResponse = await api.get<ApiResponse>('/api/users/basic', { params });
        return basicResponse.data;
      }
      throw error;
    }
  },

  getBasicUsers: async (params?: {
    role?: string;
    search?: string;
    isActive?: boolean;
    limit?: number;
  }) => {
    const response = await api.get<ApiResponse>('/api/users/basic', { params });
    return response.data;
  },

  getCurrentUserProfile: async () => {
    const response = await api.get<ApiResponse>('/api/users/profile');
    return response.data;
  },

  upgradeToAdmin: async () => {
    const response = await api.post<ApiResponse>('/api/users/upgrade-to-admin');
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/users/${id}`);
    return response.data;
  },

  createUser: async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: string;
    isActive?: boolean;
  }) => {
    const response = await api.post<ApiResponse>('/api/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
  }>) => {
    const response = await api.put<ApiResponse>(`/api/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/users/${id}`);
    return response.data;
  },

  updateProfile: async (profileData: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    avatar: string;
  }>) => {
    const response = await api.put<ApiResponse>('/api/users/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put<ApiResponse>('/api/users/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  // Driver Profile Management
  getDriverProfile: async () => {
    const response = await api.get<ApiResponse>('/api/users/driver/profile');
    return response.data;
  },

  updateDriverProfile: async (profileData: {
    isAvailable?: boolean;
    currentLocationLat?: number;
    currentLocationLng?: number;
    vehicleType?: string;
    vehicleModel?: string;
  }) => {
    const response = await api.put<ApiResponse>('/api/users/driver/profile', profileData);
    return response.data;
  },

  getAvailableDrivers: async () => {
    const response = await api.get<ApiResponse>('/api/users/drivers/available');
    return response.data;
  },

  registerDriver: async (driverData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    vehicleType: string;
    vehicleModel: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/users/admin/register-driver', driverData);
    return response.data;
  }
};

// Orders API
export const ordersAPI = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    driverId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const response = await api.get<ApiResponse>('/api/orders', { params });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: {
    pickupAddress: string;
    deliveryAddress: string;
    pickupLat?: number;
    pickupLng?: number;
    deliveryLat?: number;
    deliveryLng?: number;
    items: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      weight?: number;
      dimensions?: string;
    }>;
    scheduledPickup?: string;
    scheduledDelivery?: string;
    instructions?: string;
    isFragile?: boolean;
    requiresSignature?: boolean;
    requiresPhoto?: boolean;
  }) => {
    const response = await api.post<ApiResponse>('/api/orders', orderData);
    return response.data;
  },

  updateOrder: async (id: string, orderData: Partial<{
    status: string;
    driverId: string;
    scheduledPickup: string;
    scheduledDelivery: string;
    actualPickup: string;
    actualDelivery: string;
    instructions: string;
  }>) => {
    const response = await api.put<ApiResponse>(`/api/orders/${id}`, orderData);
    return response.data;
  },

  deleteOrder: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/orders/${id}`);
    return response.data;
  }
};

// Deliveries API
export const deliveriesAPI = {
  getDeliveries: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    driverId?: string;
    orderId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse>('/api/deliveries', { params });
    return response.data;
  },

  getDelivery: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/deliveries/${id}`);
    return response.data;
  },

  createDelivery: async (deliveryData: {
    orderId: string;
    driverId: string;
    estimatedDuration?: number;
    distance?: number;
  }) => {
    const response = await api.post<ApiResponse>('/api/deliveries', deliveryData);
    return response.data;
  },

  updateDelivery: async (id: string, deliveryData: Partial<{
    status: string;
    startTime: string;
    endTime: string;
    actualDuration: number;
    route: any;
    distance: number;
  }>) => {
    const response = await api.put<ApiResponse>(`/api/deliveries/${id}`, deliveryData);
    return response.data;
  },

  deleteDelivery: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/deliveries/${id}`);
    return response.data;
  }
};

// Signatures API
export const signaturesAPI = {
  getSignatures: async (params?: {
    page?: number;
    limit?: number;
    orderId?: string;
    userId?: string;
    signatureType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse>('/api/signatures', { params });
    return response.data;
  },

  getSignature: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/signatures/${id}`);
    return response.data;
  },

  createSignature: async (signatureData: {
    orderId: string;
    signatureData: string;
    signatureType?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/signatures', signatureData);
    return response.data;
  },

  updateSignature: async (id: string, signatureData: Partial<{
    signatureData: string;
    location: string;
  }>) => {
    const response = await api.put<ApiResponse>(`/api/signatures/${id}`, signatureData);
    return response.data;
  },

  deleteSignature: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/signatures/${id}`);
    return response.data;
  },

  getOrderSignatures: async (orderId: string) => {
    const response = await api.get<ApiResponse>(`/api/signatures/order/${orderId}`);
    return response.data;
  }
};

// Photos API
export const photosAPI = {
  getPhotos: async (params?: {
    page?: number;
    limit?: number;
    orderId?: string;
    userId?: string;
    photoType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse>('/api/photos', { params });
    return response.data;
  },

  getPhoto: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/photos/${id}`);
    return response.data;
  },

  createPhoto: async (photoData: {
    orderId: string;
    photoUrl: string;
    photoType: string;
    description?: string;
    metadata?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/photos', photoData);
    return response.data;
  },

  updatePhoto: async (id: string, photoData: Partial<{
    description: string;
    metadata: any;
  }>) => {
    const response = await api.put<ApiResponse>(`/api/photos/${id}`, photoData);
    return response.data;
  },

  deletePhoto: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/photos/${id}`);
    return response.data;
  },

  getOrderPhotos: async (orderId: string) => {
    const response = await api.get<ApiResponse>(`/api/photos/order/${orderId}`);
    return response.data;
  },

  getOrderPhotosByType: async (orderId: string, photoType: string) => {
    const response = await api.get<ApiResponse>(`/api/photos/order/${orderId}/type/${photoType}`);
    return response.data;
  },

  uploadPhoto: async (photoData: FormData) => {
    const response = await api.post<ApiResponse>('/api/driver/photo/upload', photoData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    isRead?: boolean;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get<ApiResponse>('/api/notifications', { params });
    return response.data;
  },

  getNotification: async (id: string) => {
    const response = await api.get<ApiResponse>(`/api/notifications/${id}`);
    return response.data;
  },

  createNotification: async (notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/notifications', notificationData);
    return response.data;
  },

  updateNotification: async (id: string, notificationData: {
    isRead: boolean;
  }) => {
    const response = await api.put<ApiResponse>(`/api/notifications/${id}`, notificationData);
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/notifications/${id}`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put<ApiResponse>('/api/notifications/mark-all-read');
    return response.data;
  },

  clearAllNotifications: async () => {
    const response = await api.delete<ApiResponse>('/api/notifications/clear-all');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get<ApiResponse>('/api/notifications/unread-count');
    return response.data;
  },

  createBulkNotifications: async (notifications: Array<{
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
  }>) => {
    const response = await api.post<ApiResponse>('/api/notifications/bulk', {
      notifications
    });
    return response.data;
  }
};

// Real-time Notifications API
export const realTimeNotificationsAPI = {
  sendNotification: async (notificationData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    data?: any;
    expiresAt?: string;
    actionRequired?: boolean;
    actionUrl?: string;
    actionText?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/send', notificationData);
    return response.data;
  },

  sendTemplateNotification: async (templateData: {
    templateId: string;
    userId: string;
    variables: Record<string, any>;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/template', templateData);
    return response.data;
  },

  sendBulkNotification: async (bulkData: {
    userIds: string[];
    title: string;
    message: string;
    type: string;
    priority: string;
    data?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/bulk', bulkData);
    return response.data;
  },

  sendRoleBasedNotification: async (roleData: {
    roles: string[];
    title: string;
    message: string;
    type: string;
    priority: string;
    data?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/role-based', roleData);
    return response.data;
  },

  sendSystemNotification: async (systemData: {
    title: string;
    message: string;
    type: string;
    priority: string;
    data?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/system', systemData);
    return response.data;
  },

  scheduleNotification: async (scheduleData: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: string;
    scheduledFor: string;
    data?: any;
  }) => {
    const response = await api.post<ApiResponse>('/api/real-time-notifications/schedule', scheduleData);
    return response.data;
  },

  getTemplates: async () => {
    const response = await api.get<ApiResponse>('/api/real-time-notifications/templates');
    return response.data;
  },

  getOnlineUsers: async () => {
    const response = await api.get<ApiResponse>('/api/real-time-notifications/online-users');
    return response.data;
  },

  getScheduledNotifications: async (params?: {
    page?: number;
    limit?: number;
    isSent?: boolean;
  }) => {
    const response = await api.get<ApiResponse>('/api/real-time-notifications/scheduled', { params });
    return response.data;
  },

  cancelScheduledNotification: async (id: string) => {
    const response = await api.delete<ApiResponse>(`/api/real-time-notifications/scheduled/${id}`);
    return response.data;
  }
};

// Driver API
export const driverAPI = {
  updateLocation: async (locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/driver/location', locationData);
    return response.data;
  },

  getLocation: async () => {
    const response = await api.get<ApiResponse>('/api/driver/location');
    return response.data;
  },

  updateStatus: async (statusData: {
    isAvailable: boolean;
    status?: string;
  }) => {
    const response = await api.patch<ApiResponse>('/api/driver/status', statusData);
    return response.data;
  },

  getAnalytics: async (period: string = '30d') => {
    const response = await api.get<ApiResponse>(`/api/driver/analytics?period=${period}`);
    return response.data;
  },

  getEarnings: async (period: string = '30d') => {
    const response = await api.get<ApiResponse>(`/api/driver/earnings?period=${period}`);
    return response.data;
  },

  optimizeRoute: async (routeData: {
    deliveries: Array<{
      orderId: string;
      latitude: number;
      longitude: number;
    }>;
    currentLocation: {
      latitude: number;
      longitude: number;
    };
  }) => {
    const response = await api.post<ApiResponse>('/api/driver/route/optimize', routeData);
    return response.data;
  },

  uploadPhoto: async (photoData: FormData) => {
    const response = await api.post<ApiResponse>('/api/driver/photo/upload', photoData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  getNearbyDrivers: async (params: {
    latitude: number;
    longitude: number;
    radius?: number;
    limit?: number;
  }) => {
    const response = await api.get<ApiResponse>('/api/driver/nearby', { params });
    return response.data;
  }
};

// Rapyd Payments API
export const paymentsAPI = {
  // Create a Rapyd customer
  createCustomer: async (customerData: {
    email: string;
    name: string;
    phone_number?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      country: string;
      zip: string;
    };
  }) => {
    const response = await api.post<ApiResponse>('/api/payments/customers', customerData);
    return response.data;
  },

  // Get customer by ID
  getCustomer: async (customerId: string) => {
    const response = await api.get<ApiResponse>(`/api/payments/customers/${customerId}`);
    return response.data;
  },

  // Get available payment methods
  getPaymentMethods: async (country: string = 'US', currency: string = 'USD') => {
    const response = await api.get<ApiResponse>('/api/payments/methods', {
      params: { country, currency }
    });
    return response.data;
  },

  // Create a checkout page
  createCheckoutPage: async (checkoutData: {
    orderId: string;
    amount: number;
    currency: string;
    redirect_url: string;
    complete_payment_url: string;
    cancel_payment_url: string;
    description?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/payments/checkout', checkoutData);
    return response.data;
  },

  // Get checkout page by ID
  getCheckoutPage: async (checkoutId: string) => {
    const response = await api.get<ApiResponse>(`/api/payments/checkout/${checkoutId}`);
    return response.data;
  },

  // Get payment by ID
  getPayment: async (paymentId: string) => {
    const response = await api.get<ApiResponse>(`/api/payments/${paymentId}`);
    return response.data;
  },

  // Create a refund
  createRefund: async (refundData: {
    paymentId: string;
    amount: number;
    reason?: string;
  }) => {
    const response = await api.post<ApiResponse>('/api/payments/refund', refundData);
    return response.data;
  },

  // Complete payment and update order status
  completePayment: async (paymentData: {
    orderId: string;
    paymentId: string;
    status: 'completed' | 'pending' | 'failed';
    amount: number;
  }) => {
    const response = await api.post<ApiResponse>('/api/payments/complete', paymentData);
    return response.data;
  }
};

// File upload helper
export const uploadFile = async (file: File, type: 'photo' | 'signature'): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await api.post<ApiResponse>('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.data.url;
};

// Analytics API
export const analyticsAPI = {
  // Get revenue analytics
  getRevenueAnalytics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/revenue', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get delivery analytics
  getDeliveryAnalytics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/deliveries', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get driver analytics
  getDriverAnalytics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/drivers', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get customer analytics
  getCustomerAnalytics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/customers', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get geographic analytics
  getGeographicAnalytics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/geographic', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get business metrics
  getBusinessMetrics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/business', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get comprehensive analytics dashboard
  getAnalyticsDashboard: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse>('/api/analytics/dashboard', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Get analytics summary
  getAnalyticsSummary: async () => {
    const response = await api.get<ApiResponse>('/api/analytics/summary');
    return response.data;
  }
};

export default api;
