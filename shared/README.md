# Shared Package

This package contains shared types, utilities, and constants that are used across the frontend, backend, and mobile applications.

## Structure

```
shared/
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── constants/       # Application constants
├── index.ts         # Main export file
└── README.md        # This file
```

## Usage

### Frontend (React/TypeScript)
```typescript
import { User, Order, formatDate, USER_ROLES } from '@shared';
```

### Backend (Node.js/TypeScript)
```typescript
import { User, Order, formatDate, USER_ROLES } from '@shared';
```

### Mobile (Flutter/Dart)
```dart
// Import generated Dart files
import 'package:delivery_app/shared/types.dart';
import 'package:delivery_app/shared/utils.dart';
import 'package:delivery_app/shared/constants.dart';
```

## Types

- **User Types**: User, UserRole, DriverProfile, CustomerProfile
- **Order Types**: Order, OrderItem, OrderStatus, PaymentStatus
- **Delivery Types**: Delivery, DeliveryStatus
- **Notification Types**: Notification, NotificationType
- **API Types**: ApiResponse, PaginationParams, Filters
- **Form Types**: LoginForm, RegisterForm, OrderForm

## Utilities

- **Date Utilities**: formatDate, formatDateTime, getRelativeTime
- **String Utilities**: capitalize, truncate, slugify
- **Number Utilities**: formatCurrency, formatNumber, formatPercentage
- **Validation Utilities**: isValidEmail, isValidPhone, isValidPassword
- **Array Utilities**: groupBy, sortBy, unique, chunk
- **Object Utilities**: pick, omit, deepClone
- **Location Utilities**: calculateDistance, formatDistance
- **File Utilities**: formatFileSize, getFileExtension
- **Storage Utilities**: localStorage helpers

## Constants

- **User Roles**: ADMIN, BUSINESS, DRIVER, CUSTOMER
- **Order Statuses**: PENDING, CONFIRMED, DELIVERED, etc.
- **API Endpoints**: All API endpoint paths
- **HTTP Status Codes**: Standard HTTP status codes
- **File Upload**: File size limits, allowed types
- **Pagination**: Default pagination settings
- **JWT Configuration**: Token expiry settings
- **Rate Limiting**: Rate limit configuration
- **Socket.IO Events**: Real-time event names
- **Validation Rules**: Input validation rules
- **UI Constants**: Breakpoints, dimensions
- **Error Messages**: Standardized error messages
- **Success Messages**: Standardized success messages

## Benefits

1. **Type Safety**: Shared types ensure consistency across all applications
2. **Code Reuse**: Common utilities reduce duplication
3. **Maintainability**: Centralized constants make updates easier
4. **Consistency**: Same validation rules and error messages everywhere
5. **Developer Experience**: Better IntelliSense and autocomplete

## Development

When adding new shared code:

1. Add types to `types/index.ts`
2. Add utilities to `utils/index.ts`
3. Add constants to `constants/index.ts`
4. Export from `index.ts`
5. Update this README if needed

## Notes

- All code should be framework-agnostic
- Avoid dependencies on specific libraries
- Keep utilities pure functions when possible
- Use TypeScript strict mode
- Follow consistent naming conventions
