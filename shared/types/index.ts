// Shared types across frontend, backend, and mobile app

// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'ADMIN' | 'BUSINESS' | 'DRIVER' | 'CUSTOMER';

// Order Types
export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  driverId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  items: OrderItem[];
  pickupAddress: string;
  deliveryAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  deliveryLat?: number;
  deliveryLng?: number;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  actualPickup?: string;
  actualDelivery?: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  tip?: number;
  instructions?: string;
  isFragile: boolean;
  requiresSignature: boolean;
  requiresPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PICKUP_ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weight?: number;
  dimensions?: string;
}

// Delivery Types
export interface Delivery {
  id: string;
  orderId: string;
  driverId: string;
  status: DeliveryStatus;
  startTime?: string;
  endTime?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  route?: string;
  distance?: number;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

// Driver Profile Types
export interface DriverProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: string;
  vehicleModel?: string;
  vehicleColor?: string;
  licensePlate?: string;
  insuranceInfo?: string;
  backgroundCheck: boolean;
  isAvailable: boolean;
  currentLocationLat?: number;
  currentLocationLng?: number;
  lastActive?: string;
  rating: number;
  totalDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

// Customer Profile Types
export interface CustomerProfile {
  id: string;
  userId: string;
  preferences?: string;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  data?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'ORDER_UPDATE' | 'DELIVERY_STATUS' | 'PAYMENT' | 'SYSTEM' | 'DRIVER_ALERT' | 'CUSTOMER_ALERT' | 'ADMIN_ALERT';

// Photo Types
export interface Photo {
  id: string;
  orderId: string;
  userId: string;
  photoUrl: string;
  photoType: PhotoType;
  description?: string;
  metadata?: string;
  createdAt: string;
}

export type PhotoType = 'PICKUP' | 'DELIVERY' | 'DAMAGE' | 'ISSUE';

// Signature Types
export interface Signature {
  id: string;
  orderId: string;
  userId: string;
  signatureData: string;
  signatureType: SignatureType;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  createdAt: string;
}

export type SignatureType = 'CUSTOMER' | 'DRIVER' | 'WITNESS';

// Route Types
export interface Route {
  id: string;
  driverId: string;
  locations: string; // JSON string of locations
  totalDistance: number;
  totalDuration: number;
  estimatedEarnings: number;
  optimized: boolean;
  algorithm: string;
  status: RouteStatus;
  createdAt: string;
  updatedAt: string;
}

export type RouteStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter Types
export interface UserFilters extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderFilters extends PaginationParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  driverId?: string;
  startDate?: string;
  endDate?: string;
}

// Location Types
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Analytics Types
export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
  driverPerformance: number;
  revenueGrowth: number;
  orderGrowth: number;
}

// Real-time Types
export interface RealTimeNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: any;
  timestamp: string;
  expiresAt?: string;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
  user?: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

// WebSocket Event Types
export interface WebSocketEvents {
  onNotification: (data: RealTimeNotification) => void;
  onOrderUpdate: (data: Order) => void;
  onDeliveryUpdate: (data: Delivery) => void;
  onDriverLocationUpdate: (data: { driverId: string; location: Location }) => void;
}

// Error Types
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  role: UserRole;
}

export interface OrderForm {
  items: OrderItem[];
  pickupAddress: string;
  deliveryAddress: string;
  scheduledPickup?: string;
  scheduledDelivery?: string;
  instructions?: string;
  isFragile: boolean;
  requiresSignature: boolean;
  requiresPhoto: boolean;
}

// Dashboard Types
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalDeliveries: number;
  activeDrivers: number;
  pendingOrders: number;
  completedDeliveries: number;
  averageRating: number;
  customerSatisfaction: number;
}

// Business Dashboard Types
export interface BusinessDashboardData {
  overview: {
    totalDrivers: number;
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
  };
  recentOrders: Order[];
  driverStats: {
    id: string;
    name: string;
    totalDeliveries: number;
    rating: number;
    isAvailable: boolean;
  }[];
  financialMetrics: {
    revenue: number;
    profit: number;
    expenses: number;
    growth: number;
  };
}
