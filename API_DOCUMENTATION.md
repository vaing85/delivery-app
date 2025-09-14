# Delivery App API Documentation

## Overview

The Delivery App API provides a comprehensive set of endpoints for managing deliveries, orders, users, and real-time notifications. This RESTful API is built with Node.js, Express, and Prisma.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.deliveryapp.com`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-access-token>
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Error Format

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "details": [ ... ]
  }
}
```

## Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "CUSTOMER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1234567890abcdef",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "isActive": true,
      "isVerified": false,
      "createdAt": "2024-01-15T10:30:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### POST /api/auth/login

Authenticate user and get access tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "...",
      "refreshToken": "..."
    }
  }
}
```

### POST /api/auth/refresh

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx1234567890abcdef",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "isActive": true,
      "isVerified": true,
      "avatar": "https://example.com/avatar.jpg",
      "phone": "+1234567890",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

## Order Endpoints

### POST /api/orders

Create a new order.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "items": [
    {
      "name": "Pizza Margherita",
      "description": "Fresh mozzarella, tomato sauce, basil",
      "quantity": 2,
      "unitPrice": 12.99,
      "totalPrice": 25.98
    }
  ],
  "pickupAddress": "123 Main St, City, State 12345",
  "deliveryAddress": "456 Oak Ave, City, State 12345",
  "instructions": "Handle with care",
  "isFragile": true,
  "requiresSignature": true,
  "requiresPhoto": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "clx1234567890abcdef",
      "orderNumber": "ORD-2024-001",
      "customerId": "clx1234567890abcdef",
      "status": "PENDING",
      "paymentStatus": "PENDING",
      "items": [ ... ],
      "pickupAddress": "123 Main St, City, State 12345",
      "deliveryAddress": "456 Oak Ave, City, State 12345",
      "subtotal": 25.98,
      "tax": 2.60,
      "deliveryFee": 5.00,
      "total": 33.58,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### GET /api/orders

Get orders with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by order status
- `paymentStatus` (optional): Filter by payment status
- `customerId` (optional): Filter by customer ID
- `driverId` (optional): Filter by driver ID
- `startDate` (optional): Filter by start date (ISO 8601)
- `endDate` (optional): Filter by end date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "orders": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### GET /api/orders/:id

Get order details by ID.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "clx1234567890abcdef",
      "orderNumber": "ORD-2024-001",
      "customerId": "clx1234567890abcdef",
      "driverId": "clx1234567890abcdef",
      "status": "IN_TRANSIT",
      "paymentStatus": "PAID",
      "items": [ ... ],
      "pickupAddress": "123 Main St, City, State 12345",
      "deliveryAddress": "456 Oak Ave, City, State 12345",
      "pickupLat": 40.7128,
      "pickupLng": -74.0060,
      "deliveryLat": 40.7589,
      "deliveryLng": -73.9851,
      "scheduledPickup": "2024-01-15T12:00:00Z",
      "scheduledDelivery": "2024-01-15T14:00:00Z",
      "actualPickup": "2024-01-15T12:15:00Z",
      "subtotal": 25.98,
      "tax": 2.60,
      "deliveryFee": 5.00,
      "total": 33.58,
      "tip": 5.00,
      "instructions": "Handle with care",
      "isFragile": true,
      "requiresSignature": true,
      "requiresPhoto": true,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T12:15:00Z"
    }
  }
}
```

### PUT /api/orders/:id

Update order (Admin/Driver only).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Request Body:**
```json
{
  "status": "PICKED_UP",
  "driverId": "clx1234567890abcdef",
  "actualPickup": "2024-01-15T12:15:00Z"
}
```

---

## Delivery Endpoints

### GET /api/deliveries

Get deliveries with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by delivery status
- `driverId` (optional): Filter by driver ID
- `orderId` (optional): Filter by order ID

### GET /api/deliveries/:id

Get delivery details by ID.

### PUT /api/deliveries/:id

Update delivery status.

---

## User Endpoints

### GET /api/users

Get users with filtering and pagination (Admin/Business only).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `role` (optional): Filter by user role
- `isActive` (optional): Filter by active status
- `search` (optional): Search by name or email

### GET /api/users/:id

Get user details by ID.

### PUT /api/users/:id

Update user information.

---

## Driver Endpoints

### GET /api/drivers

Get drivers with filtering and pagination.

**Headers:**
```
Authorization: Bearer <access-token>
```

### GET /api/drivers/:id

Get driver details by ID.

### PUT /api/drivers/:id

Update driver information.

### GET /api/drivers/available

Get available drivers.

---

## Notification Endpoints

### GET /api/notifications

Get user notifications.

**Headers:**
```
Authorization: Bearer <access-token>
```

### POST /api/notifications/:id/read

Mark notification as read.

### DELETE /api/notifications/:id

Delete notification.

---

## Real-time Notification Endpoints

### GET /api/real-time-notifications

Get real-time notifications (Admin only).

### GET /api/real-time-notifications/templates

Get notification templates (Admin only).

### GET /api/real-time-notifications/online-users

Get online users count (Admin only).

---

## File Upload Endpoints

### POST /api/photos/upload

Upload photo for order.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

**Request Body:**
- `file`: Image file
- `orderId`: Order ID
- `photoType`: Type of photo (PICKUP, DELIVERY, DAMAGE, ISSUE)

### POST /api/signatures/upload

Upload signature for order.

**Headers:**
```
Authorization: Bearer <access-token>
Content-Type: multipart/form-data
```

---

## Analytics Endpoints

### GET /api/analytics/dashboard

Get dashboard analytics.

**Headers:**
```
Authorization: Bearer <access-token>
```

### GET /api/analytics/business

Get business analytics (Business/Admin only).

---

## Route Optimization Endpoints

### GET /api/route-optimization/driver/:driverId/routes

Get optimized routes for driver.

### POST /api/route-optimization/optimize

Optimize routes for driver.

---

## Health Check

### GET /health

Check API health status.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "environment": "development",
  "database": "Connected"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **File upload endpoints**: 20 requests per 15 minutes

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

---

## Error Handling

The API provides detailed error messages for different scenarios:

### Validation Errors (400)
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Authentication Errors (401)
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials"
  }
}
```

### Authorization Errors (403)
```json
{
  "success": false,
  "error": {
    "message": "Access forbidden"
  }
}
```

### Not Found Errors (404)
```json
{
  "success": false,
  "error": {
    "message": "Resource not found"
  }
}
```

---

## SDKs and Examples

### JavaScript/TypeScript

```javascript
// Install the SDK
npm install @delivery-app/api-client

// Usage
import { DeliveryAppAPI } from '@delivery-app/api-client';

const api = new DeliveryAppAPI({
  baseURL: 'http://localhost:5000',
  apiKey: 'your-api-key'
});

// Create an order
const order = await api.orders.create({
  items: [{
    name: 'Pizza Margherita',
    quantity: 2,
    unitPrice: 12.99,
    totalPrice: 25.98
  }],
  pickupAddress: '123 Main St, City, State 12345',
  deliveryAddress: '456 Oak Ave, City, State 12345'
});
```

### cURL Examples

```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Get orders
curl -X GET http://localhost:5000/api/orders \
  -H "Authorization: Bearer <access-token>"
```

---

## WebSocket Events

The API supports real-time communication via WebSocket:

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-access-token'
  }
});
```

### Events

- `notification` - New notification received
- `order_update` - Order status updated
- `delivery_update` - Delivery status updated
- `driver_location_update` - Driver location updated

---

## Changelog

### Version 1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Order management
- Delivery tracking
- Real-time notifications
- File upload support
- Analytics endpoints

---

## Support

For API support and questions:

- **Email**: api-support@deliveryapp.com
- **Documentation**: https://docs.deliveryapp.com
- **Status Page**: https://status.deliveryapp.com
- **GitHub**: https://github.com/delivery-app/api
