// Rapyd configuration
export const RAPYD_CONFIG = {
  // Rapyd API endpoints
  baseUrl: import.meta.env.VITE_RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net',
  
  // Supported countries and currencies
  supportedCountries: [
    { code: 'US', name: 'United States', currency: 'USD' },
    { code: 'CA', name: 'Canada', currency: 'CAD' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
    { code: 'DE', name: 'Germany', currency: 'EUR' },
    { code: 'FR', name: 'France', currency: 'EUR' },
    { code: 'ES', name: 'Spain', currency: 'EUR' },
    { code: 'IT', name: 'Italy', currency: 'EUR' },
    { code: 'AU', name: 'Australia', currency: 'AUD' },
    { code: 'JP', name: 'Japan', currency: 'JPY' },
    { code: 'SG', name: 'Singapore', currency: 'SGD' }
  ],

  // Default settings
  defaultCountry: 'US',
  defaultCurrency: 'USD',

  // Payment method categories
  paymentCategories: {
    CARD: 'Card Payments',
    BANK: 'Bank Transfers',
    WALLET: 'Digital Wallets',
    CASH: 'Cash Payments',
    CRYPTOCURRENCY: 'Cryptocurrency'
  },

  // UI settings
  ui: {
    theme: 'light',
    primaryColor: '#1976d2',
    borderRadius: '8px',
    showPaymentMethodImages: true,
    enableCountrySelection: true
  },

  // Security settings
  security: {
    enableWebhookVerification: true,
    requireCustomerVerification: false,
    allowGuestCheckout: true
  }
};

// Helper functions
export const getCountryByCode = (code: string) => {
  return RAPYD_CONFIG.supportedCountries.find(country => country.code === code);
};

export const getCurrencyByCountry = (countryCode: string) => {
  const country = getCountryByCode(countryCode);
  return country?.currency || RAPYD_CONFIG.defaultCurrency;
};

export const isCountrySupported = (countryCode: string) => {
  return RAPYD_CONFIG.supportedCountries.some(country => country.code === countryCode);
};

export const getSupportedCurrencies = () => {
  return [...new Set(RAPYD_CONFIG.supportedCountries.map(country => country.currency))];
};

export default RAPYD_CONFIG;

