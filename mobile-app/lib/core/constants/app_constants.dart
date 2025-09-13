class AppConstants {
  // App Information
  static const String appName = 'Delivery App';
  static const String appVersion = '1.0.0';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:5000/api';
  static const String socketUrl = 'http://localhost:5000';
  
  // Storage Keys
  static const String userTokenKey = 'user_token';
  static const String userDataKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';
  
  // User Roles
  static const String roleCustomer = 'CUSTOMER';
  static const String roleDriver = 'DRIVER';
  static const String roleBusiness = 'BUSINESS';
  static const String roleAdmin = 'ADMIN';
  
  // Order Status
  static const String orderPending = 'PENDING';
  static const String orderConfirmed = 'CONFIRMED';
  static const String orderPickedUp = 'PICKED_UP';
  static const String orderInTransit = 'IN_TRANSIT';
  static const String orderDelivered = 'DELIVERED';
  static const String orderCancelled = 'CANCELLED';
  
  // Delivery Status
  static const String deliveryPending = 'PENDING';
  static const String deliveryAssigned = 'ASSIGNED';
  static const String deliveryInProgress = 'IN_PROGRESS';
  static const String deliveryCompleted = 'COMPLETED';
  static const String deliveryFailed = 'FAILED';
  
  // Payment Status
  static const String paymentPending = 'PENDING';
  static const String paymentCompleted = 'COMPLETED';
  static const String paymentFailed = 'FAILED';
  static const String paymentRefunded = 'REFUNDED';
  
  // Notification Types
  static const String notificationOrderUpdate = 'ORDER_UPDATE';
  static const String notificationDeliveryUpdate = 'DELIVERY_UPDATE';
  static const String notificationPaymentUpdate = 'PAYMENT_UPDATE';
  static const String notificationSystem = 'SYSTEM';
  
  // Map Configuration
  static const double defaultZoom = 15.0;
  static const double maxZoom = 20.0;
  static const double minZoom = 5.0;
  
  // Timeouts
  static const int apiTimeout = 30000; // 30 seconds
  static const int socketTimeout = 10000; // 10 seconds
  
  // File Upload
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'gif'];
  
  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minPhoneLength = 10;
  static const int maxPhoneLength = 15;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Error Messages
  static const String networkError = 'Network connection error';
  static const String serverError = 'Server error occurred';
  static const String unknownError = 'An unknown error occurred';
  static const String invalidCredentials = 'Invalid email or password';
  static const String userNotFound = 'User not found';
  static const String emailAlreadyExists = 'Email already exists';
  
  // Success Messages
  static const String loginSuccess = 'Login successful';
  static const String registerSuccess = 'Registration successful';
  static const String orderCreated = 'Order created successfully';
  static const String deliveryUpdated = 'Delivery updated successfully';
  static const String profileUpdated = 'Profile updated successfully';
}
