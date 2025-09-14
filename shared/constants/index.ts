// Shared constants across frontend, backend, and mobile app

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  BUSINESS: 'BUSINESS',
  DRIVER: 'DRIVER',
  CUSTOMER: 'CUSTOMER',
} as const;

// Order Statuses
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PICKUP_ASSIGNED: 'PICKUP_ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

// Delivery Statuses
export const DELIVERY_STATUS = {
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  ORDER_UPDATE: 'ORDER_UPDATE',
  DELIVERY_STATUS: 'DELIVERY_STATUS',
  PAYMENT: 'PAYMENT',
  SYSTEM: 'SYSTEM',
  DRIVER_ALERT: 'DRIVER_ALERT',
  CUSTOMER_ALERT: 'CUSTOMER_ALERT',
  ADMIN_ALERT: 'ADMIN_ALERT',
} as const;

// Photo Types
export const PHOTO_TYPES = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
  DAMAGE: 'DAMAGE',
  ISSUE: 'ISSUE',
} as const;

// Signature Types
export const SIGNATURE_TYPES = {
  CUSTOMER: 'CUSTOMER',
  DRIVER: 'DRIVER',
  WITNESS: 'WITNESS',
} as const;

// Route Statuses
export const ROUTE_STATUS = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  REFRESH: '/api/auth/refresh',
  LOGOUT: '/api/auth/logout',
  ME: '/api/auth/me',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  USERS_BASIC: '/api/users/basic',
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_DETAILS: '/api/orders/:id',
  ORDER_CREATE: '/api/orders',
  ORDER_UPDATE: '/api/orders/:id',
  ORDER_DELETE: '/api/orders/:id',
  
  // Deliveries
  DELIVERIES: '/api/deliveries',
  DELIVERY_DETAILS: '/api/deliveries/:id',
  DELIVERY_UPDATE: '/api/deliveries/:id',
  
  // Drivers
  DRIVERS: '/api/drivers',
  DRIVER_PROFILE: '/api/drivers/profile',
  DRIVER_LOCATION: '/api/drivers/location',
  AVAILABLE_DRIVERS: '/api/drivers/available',
  
  // Notifications
  NOTIFICATIONS: '/api/notifications',
  NOTIFICATION_READ: '/api/notifications/:id/read',
  NOTIFICATION_DELETE: '/api/notifications/:id',
  
  // Real-time Notifications
  REAL_TIME_NOTIFICATIONS: '/api/real-time-notifications',
  NOTIFICATION_TEMPLATES: '/api/real-time-notifications/templates',
  ONLINE_USERS: '/api/real-time-notifications/online-users',
  
  // Photos
  PHOTOS: '/api/photos',
  PHOTO_UPLOAD: '/api/photos/upload',
  
  // Signatures
  SIGNATURES: '/api/signatures',
  SIGNATURE_UPLOAD: '/api/signatures/upload',
  
  // Analytics
  ANALYTICS: '/api/analytics',
  DASHBOARD_STATS: '/api/analytics/dashboard',
  BUSINESS_ANALYTICS: '/api/analytics/business',
  
  // Route Optimization
  ROUTE_OPTIMIZATION: '/api/route-optimization',
  OPTIMIZE_ROUTES: '/api/route-optimization/optimize',
  
  // Health
  HEALTH: '/health',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'],
  UPLOAD_PATH: './uploads',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1,
} as const;

// JWT Configuration
export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ALGORITHM: 'HS256',
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  MESSAGE: 'Too many requests from this IP, please try again later.',
} as const;

// Socket.IO Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  
  // Notifications
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  
  // Orders
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  
  // Deliveries
  DELIVERY_ASSIGNED: 'delivery_assigned',
  DELIVERY_STARTED: 'delivery_started',
  DELIVERY_COMPLETED: 'delivery_completed',
  DELIVERY_FAILED: 'delivery_failed',
  
  // Driver Location
  DRIVER_LOCATION_UPDATE: 'driver_location_update',
  DRIVER_STATUS_UPDATE: 'driver_status_update',
  
  // Real-time
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  ONLINE_USERS: 'online_users',
} as const;

// Database
export const DATABASE = {
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
  MAX_CONNECTIONS: 10,
} as const;

// Cache
export const CACHE = {
  TTL: {
    SHORT: 300, // 5 minutes
    MEDIUM: 1800, // 30 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  KEYS: {
    USER: 'user:',
    ORDER: 'order:',
    DELIVERY: 'delivery:',
    DRIVER: 'driver:',
    NOTIFICATION: 'notification:',
  },
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: false,
  },
  EMAIL: {
    MAX_LENGTH: 254,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  ORDER: {
    MAX_ITEMS: 50,
    MAX_INSTRUCTIONS_LENGTH: 500,
  },
} as const;

// UI Constants
export const UI = {
  BREAKPOINTS: {
    XS: 0,
    SM: 600,
    MD: 900,
    LG: 1200,
    XL: 1536,
  },
  DRAWER_WIDTH: 240,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 60,
  BORDER_RADIUS: 8,
  SHADOW: '0 2px 8px rgba(0,0,0,0.1)',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // General
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Resource conflict',
  
  // Auth
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  USER_INACTIVE: 'User account is inactive',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  WEAK_PASSWORD: 'Password is too weak',
  
  // Orders
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_CANNOT_BE_CANCELLED: 'Order cannot be cancelled',
  INVALID_ORDER_STATUS: 'Invalid order status',
  
  // Deliveries
  DELIVERY_NOT_FOUND: 'Delivery not found',
  DRIVER_NOT_AVAILABLE: 'No drivers available',
  INVALID_DELIVERY_STATUS: 'Invalid delivery status',
  
  // Files
  FILE_TOO_LARGE: 'File size too large',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Network
  NETWORK_ERROR: 'Network error',
  TIMEOUT: 'Request timeout',
  OFFLINE: 'You are offline',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTRATION_SUCCESS: 'Registration successful',
  PASSWORD_RESET_SUCCESS: 'Password reset successful',
  
  // Orders
  ORDER_CREATED: 'Order created successfully',
  ORDER_UPDATED: 'Order updated successfully',
  ORDER_CANCELLED: 'Order cancelled successfully',
  
  // Deliveries
  DELIVERY_ASSIGNED: 'Delivery assigned successfully',
  DELIVERY_UPDATED: 'Delivery updated successfully',
  DELIVERY_COMPLETED: 'Delivery completed successfully',
  
  // Files
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  
  // General
  SAVED: 'Saved successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SENT: 'Sent successfully',
} as const;

// Default Values
export const DEFAULTS = {
  USER: {
    ROLE: USER_ROLES.CUSTOMER,
    IS_ACTIVE: true,
    IS_VERIFIED: false,
  },
  ORDER: {
    STATUS: ORDER_STATUS.PENDING,
    PAYMENT_STATUS: PAYMENT_STATUS.PENDING,
    IS_FRAGILE: false,
    REQUIRES_SIGNATURE: true,
    REQUIRES_PHOTO: true,
  },
  DELIVERY: {
    STATUS: DELIVERY_STATUS.ASSIGNED,
  },
  NOTIFICATION: {
    IS_READ: false,
    PRIORITY: PRIORITY_LEVELS.MEDIUM,
  },
  PAGINATION: {
    PAGE: 1,
    LIMIT: PAGINATION.DEFAULT_LIMIT,
  },
} as const;

// Feature Flags
export const FEATURES = {
  REAL_TIME_TRACKING: true,
  PUSH_NOTIFICATIONS: true,
  OFFLINE_MODE: true,
  DARK_MODE: true,
  MULTI_LANGUAGE: false,
  ANALYTICS: true,
  ROUTE_OPTIMIZATION: true,
  PAYMENT_INTEGRATION: true,
  FILE_UPLOAD: true,
  SIGNATURE_CAPTURE: true,
} as const;

// Environment
export const ENV = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;
