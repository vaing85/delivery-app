# Delivery App - Mobile Application

A comprehensive Flutter mobile application for the delivery management system, supporting multiple user roles including customers, drivers, business owners, and administrators.

## Features

### 🔐 Authentication
- User registration and login
- Role-based access control (Customer, Driver, Business, Admin)
- Password reset functionality
- Biometric authentication support
- Secure token management

### 📱 User Roles

#### Customer
- Create and manage delivery orders
- Track deliveries in real-time
- Payment processing with Stripe
- Order history and receipts
- Push notifications for order updates

#### Driver
- View available delivery jobs
- Accept and manage deliveries
- Real-time GPS tracking
- Photo and signature capture
- Earnings tracking and analytics
- Availability toggle

#### Business Owner
- Manage business operations
- View driver performance
- Order management and analytics
- Revenue tracking
- Driver management

#### Administrator
- System-wide monitoring
- User management
- Analytics and reporting
- System configuration

### 🚀 Core Features
- **Real-time Notifications**: Firebase Cloud Messaging integration
- **Location Services**: GPS tracking and geolocation
- **Camera Integration**: Photo capture for deliveries
- **Signature Capture**: Digital signature collection
- **Offline Support**: Local data caching with Hive
- **Push Notifications**: Real-time updates and alerts
- **Maps Integration**: Google Maps for navigation and tracking
- **Payment Processing**: Stripe integration for secure payments

## Tech Stack

- **Framework**: Flutter 3.10+
- **State Management**: Riverpod
- **Navigation**: GoRouter
- **Local Storage**: Hive + SharedPreferences
- **HTTP Client**: Dio
- **Maps**: Google Maps Flutter
- **Notifications**: Firebase Cloud Messaging
- **Authentication**: JWT with refresh tokens
- **Image Processing**: Image Picker, Image Cropper
- **Charts**: FL Chart
- **QR Codes**: QR Flutter

## Project Structure

```
lib/
├── core/
│   ├── constants/          # App constants and configuration
│   ├── services/           # Core services (storage, notifications)
│   ├── theme/              # App theming and styling
│   └── utils/              # Utility functions
├── features/
│   ├── auth/               # Authentication feature
│   │   ├── providers/      # Auth state management
│   │   ├── screens/        # Login, register screens
│   │   ├── services/       # Auth API services
│   │   └── widgets/        # Auth-specific widgets
│   ├── dashboard/          # Dashboard feature
│   ├── orders/             # Order management
│   ├── deliveries/         # Delivery tracking
│   ├── profile/            # User profile management
│   └── notifications/      # Notification handling
└── shared/
    ├── models/             # Data models
    └── widgets/            # Reusable widgets
```

## Getting Started

### Prerequisites
- Flutter SDK 3.10 or higher
- Dart SDK 3.0 or higher
- Android Studio / Xcode
- Firebase project setup

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code**
   ```bash
   flutter packages pub run build_runner build
   ```

4. **Configure Firebase**
   - Add `google-services.json` to `android/app/`
   - Add `GoogleService-Info.plist` to `ios/Runner/`

5. **Configure Google Maps**
   - Add API keys to platform-specific configuration files

6. **Run the app**
   ```bash
   flutter run
   ```

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```
API_BASE_URL=http://localhost:5000/api
SOCKET_URL=http://localhost:5000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Firebase Setup
1. Create a Firebase project
2. Enable Authentication, Cloud Messaging, and Firestore
3. Download configuration files
4. Configure push notifications

### Google Maps Setup
1. Create a Google Cloud project
2. Enable Maps SDK for Android/iOS
3. Generate API keys
4. Add keys to platform configuration

## Building for Production

### Android
```bash
flutter build apk --release
# or
flutter build appbundle --release
```

### iOS
```bash
flutter build ios --release
```

## Testing

### Unit Tests
```bash
flutter test
```

### Integration Tests
```bash
flutter test integration_test/
```

## Demo Accounts

The app includes demo accounts for testing:

- **Customer**: customer@demo.com / password123
- **Driver**: driver@demo.com / password123
- **Business**: business@demo.com / password123
- **Admin**: admin@demo.com / password123

## API Integration

The mobile app integrates with the backend API endpoints:

- **Authentication**: `/api/auth/*`
- **Orders**: `/api/orders/*`
- **Deliveries**: `/api/deliveries/*`
- **Users**: `/api/users/*`
- **Notifications**: `/api/notifications/*`
- **Payments**: `/api/payments/*`

## Security Features

- JWT token authentication
- Secure token storage
- API request/response encryption
- Biometric authentication
- Certificate pinning
- Input validation and sanitization

## Performance Optimizations

- Image caching and compression
- Lazy loading of data
- Efficient state management
- Background task optimization
- Memory management
- Network request optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact the development team or create an issue in the repository.
