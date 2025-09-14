# Rapyd Payment Integration

This document describes the Rapyd payment integration implemented in the delivery app.

## Overview

Rapyd is a global payment platform that provides a unified API for accepting payments worldwide. This integration allows the delivery app to accept payments from customers using various payment methods across different countries.

## Features

- **Global Payment Methods**: Support for cards, bank transfers, digital wallets, and cash payments
- **Multi-Currency Support**: Accept payments in multiple currencies
- **Hosted Checkout**: Secure, PCI-compliant payment pages
- **Webhook Support**: Real-time payment status updates
- **Refund Management**: Process refunds through Rapyd
- **Customer Management**: Create and manage customer profiles

## Setup

### 1. Rapyd Account Setup

1. Sign up for a Rapyd account at [https://dashboard.rapyd.net](https://dashboard.rapyd.net)
2. Complete the verification process
3. Obtain your API credentials:
   - Access Key
   - Secret Key
   - Webhook Secret (for production)

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Rapyd Payment Configuration
RAPYD_ACCESS_KEY=your-rapyd-access-key
RAPYD_SECRET_KEY=your-rapyd-secret-key
RAPYD_BASE_URL=https://sandboxapi.rapyd.net
```

For production, change the base URL to:
```env
RAPYD_BASE_URL=https://api.rapyd.net
```

### 3. Frontend Configuration

Add the following environment variables to your frontend `.env` file:

```env
VITE_RAPYD_BASE_URL=https://sandboxapi.rapyd.net
```

## API Endpoints

### Backend Endpoints

- `POST /api/payments/customers` - Create a Rapyd customer
- `GET /api/payments/customers/:id` - Get customer by ID
- `GET /api/payments/methods` - Get available payment methods
- `POST /api/payments/checkout` - Create a checkout page
- `GET /api/payments/checkout/:id` - Get checkout page by ID
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments/refund` - Create a refund
- `POST /api/payments/webhook` - Handle Rapyd webhooks

### Frontend Components

- `RapydPaymentComponent` - Main payment component with step-by-step flow
- `PaymentPage` - Full payment page with order summary

## Usage

### 1. Basic Payment Flow

```typescript
import { RapydPaymentComponent } from '@/components/Payments';

// In your component
<RapydPaymentComponent
  orderId="order-123"
  amount={100.00}
  currency="USD"
  onPaymentSuccess={(paymentData) => {
    console.log('Payment successful:', paymentData);
  }}
  onPaymentError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### 2. Creating a Checkout Page

```typescript
import { paymentsAPI } from '@/services/api';

const checkoutData = {
  orderId: 'order-123',
  amount: 100.00,
  currency: 'USD',
  redirect_url: 'https://yourapp.com/orders/order-123',
  complete_payment_url: 'https://yourapp.com/orders/order-123?payment=success',
  cancel_payment_url: 'https://yourapp.com/orders/order-123?payment=cancelled',
  description: 'Payment for order #123'
};

const response = await paymentsAPI.createCheckoutPage(checkoutData);
```

### 3. Processing Refunds

```typescript
const refundData = {
  paymentId: 'payment-123',
  amount: 50.00,
  reason: 'Customer requested partial refund'
};

const response = await paymentsAPI.createRefund(refundData);
```

## Payment Methods

Rapyd supports various payment methods depending on the country:

### Card Payments
- Visa, Mastercard, American Express
- Local cards (e.g., UnionPay, JCB)

### Bank Transfers
- ACH (US)
- SEPA (Europe)
- Local bank transfers

### Digital Wallets
- PayPal
- Apple Pay
- Google Pay
- Local wallets (e.g., Alipay, WeChat Pay)

### Cash Payments
- Cash on delivery
- Bank deposits
- Convenience store payments

## Webhook Handling

The integration includes webhook support for real-time payment updates:

### Webhook Events
- `CHECKOUT_COMPLETED` - Checkout page completed
- `PAYMENT_COMPLETED` - Payment successful
- `PAYMENT_FAILED` - Payment failed
- `REFUND_COMPLETED` - Refund processed

### Webhook Configuration

1. Set up webhook endpoints in your Rapyd dashboard
2. Configure the webhook URL: `https://yourapp.com/api/payments/webhook`
3. The webhook handler automatically updates order status

## Security

- All API requests are signed using HMAC-SHA256
- Webhook signatures are verified to prevent tampering
- Sensitive data is not stored locally
- PCI compliance is handled by Rapyd

## Testing

### Sandbox Environment

Use the sandbox environment for testing:
- Base URL: `https://sandboxapi.rapyd.net`
- Test cards and payment methods are available
- No real money is processed

### Test Cards

Rapyd provides test card numbers for different scenarios:
- Success: `4111111111111111`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

## Error Handling

The integration includes comprehensive error handling:

- Network errors
- API errors
- Validation errors
- Webhook verification errors

All errors are logged and appropriate user messages are displayed.

## Monitoring

Monitor your Rapyd integration through:
- Rapyd Dashboard
- Application logs
- Webhook delivery status
- Payment success rates

## Support

For issues with the Rapyd integration:
1. Check the application logs
2. Verify API credentials
3. Test in sandbox environment
4. Contact Rapyd support for API issues

## Changelog

### v1.0.0
- Initial Rapyd integration
- Support for hosted checkout
- Customer management
- Refund processing
- Webhook handling
- Multi-currency support

