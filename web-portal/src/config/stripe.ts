// Stripe configuration
export const STRIPE_CONFIG = {
  // For development, you can use test keys
  // Get your keys from: https://dashboard.stripe.com/test/apikeys
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock_key_for_development',
  
  // Stripe Elements options
  appearance: {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#1976d2',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '2px',
      borderRadius: '4px',
    },
  },
  
  // Payment method types
  paymentMethodTypes: ['card'] as const,
  
  // Currency
  currency: 'usd' as const,
};

// Mock Stripe key for development (when no real key is provided)
export const MOCK_STRIPE_KEY = 'pk_test_mock_key_for_development';

// Check if we're using a real Stripe key
export const isRealStripeKey = (key: string) => {
  return key && key !== MOCK_STRIPE_KEY && key.startsWith('pk_');
};

// Get the appropriate Stripe key
export const getStripeKey = () => {
  const key = STRIPE_CONFIG.publishableKey;
  return isRealStripeKey(key) ? key : MOCK_STRIPE_KEY;
};

