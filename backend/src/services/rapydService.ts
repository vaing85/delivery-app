import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto-js';

// Rapyd API Configuration
const RAPYD_BASE_URL = process.env.RAPYD_BASE_URL || 'https://sandboxapi.rapyd.net';
const RAPYD_ACCESS_KEY = process.env.RAPYD_ACCESS_KEY;
const RAPYD_SECRET_KEY = process.env.RAPYD_SECRET_KEY;

// Rapyd API endpoints
const RAPYD_ENDPOINTS = {
  CHECKOUT: '/v1/checkout',
  PAYMENT_METHODS: '/v1/payment_methods',
  CUSTOMERS: '/v1/customers',
  PAYMENTS: '/v1/payments',
  REFUNDS: '/v1/refunds',
  WEBHOOKS: '/v1/webhooks'
};

export interface RapydCustomer {
  id: string;
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
}

export interface RapydPaymentMethod {
  id: string;
  type: string;
  category: string;
  image: string;
  name: string;
  country: string;
  currencies: string[];
}

export interface RapydCheckoutPage {
  id: string;
  amount: number;
  currency: string;
  merchant_reference_id: string;
  redirect_url: string;
  complete_payment_url: string;
  cancel_payment_url: string;
  status: string;
  created_at: number;
  expires_at: number;
}

export interface RapydPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  merchant_reference_id: string;
  payment_method: any;
  created_at: number;
  updated_at: number;
}

export interface RapydRefund {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payment: string;
  merchant_reference_id: string;
  created_at: number;
}

export class RapydService {
  private accessKey: string;
  private secretKey: string;
  private baseUrl: string;

  constructor() {
    this.accessKey = RAPYD_ACCESS_KEY || '';
    this.secretKey = RAPYD_SECRET_KEY || '';
    this.baseUrl = RAPYD_BASE_URL;

    if (!this.accessKey || !this.secretKey) {
      console.warn('Rapyd API keys not configured. Payment functionality will be limited.');
    }
  }

  /**
   * Generate Rapyd signature for API authentication
   */
  private generateSignature(method: string, url: string, body: string = ''): string {
    const salt = this.generateSalt();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const toSign = method.toLowerCase() + url + salt + timestamp + this.accessKey + this.secretKey + body;
    const signature = crypto.HmacSHA256(toSign, this.secretKey).toString(crypto.enc.Hex);
    return crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(signature));
  }

  /**
   * Generate random salt for signature
   */
  private generateSalt(): string {
    return crypto.lib.WordArray.random(12).toString(crypto.enc.Hex);
  }

  /**
   * Make authenticated request to Rapyd API
   */
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data: any = null
  ): Promise<AxiosResponse<T>> {
    if (!this.accessKey || !this.secretKey) {
      throw new Error('Rapyd API keys not configured');
    }

    const url = `${this.baseUrl}${endpoint}`;
    const body = data ? JSON.stringify(data) : '';
    const salt = this.generateSalt();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.generateSignature(method, endpoint, body);

    const headers = {
      'Content-Type': 'application/json',
      'access_key': this.accessKey,
      'salt': salt,
      'timestamp': timestamp,
      'signature': signature
    };

    try {
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers,
        data: data
      });

      return response;
    } catch (error: any) {
      console.error('Rapyd API Error:', error.response?.data || error.message);
      throw new Error(`Rapyd API Error: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  /**
   * Create a customer in Rapyd
   */
  async createCustomer(customerData: {
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
  }): Promise<RapydCustomer> {
    const response = await this.makeRequest<RapydCustomer>('POST', RAPYD_ENDPOINTS.CUSTOMERS, customerData);
    return response.data;
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: string): Promise<RapydCustomer> {
    const response = await this.makeRequest<RapydCustomer>('GET', `${RAPYD_ENDPOINTS.CUSTOMERS}/${customerId}`);
    return response.data;
  }

  /**
   * Get available payment methods for a country
   */
  async getPaymentMethods(country: string = 'US', currency: string = 'USD'): Promise<RapydPaymentMethod[]> {
    const response = await this.makeRequest<{ data: RapydPaymentMethod[] }>(
      'GET',
      `${RAPYD_ENDPOINTS.PAYMENT_METHODS}?country=${country}&currency=${currency}`
    );
    return response.data.data;
  }

  /**
   * Create a checkout page
   */
  async createCheckoutPage(checkoutData: {
    amount: number;
    currency: string;
    merchant_reference_id: string;
    customer: string;
    payment_method_types?: string[];
    redirect_url: string;
    complete_payment_url: string;
    cancel_payment_url: string;
    description?: string;
    metadata?: any;
  }): Promise<RapydCheckoutPage> {
    const response = await this.makeRequest<RapydCheckoutPage>('POST', RAPYD_ENDPOINTS.CHECKOUT, checkoutData);
    return response.data;
  }

  /**
   * Get checkout page by ID
   */
  async getCheckoutPage(checkoutId: string): Promise<RapydCheckoutPage> {
    const response = await this.makeRequest<RapydCheckoutPage>('GET', `${RAPYD_ENDPOINTS.CHECKOUT}/${checkoutId}`);
    return response.data;
  }

  /**
   * Create a payment
   */
  async createPayment(paymentData: {
    amount: number;
    currency: string;
    merchant_reference_id: string;
    customer: string;
    payment_method: any;
    description?: string;
    metadata?: any;
  }): Promise<RapydPayment> {
    const response = await this.makeRequest<RapydPayment>('POST', RAPYD_ENDPOINTS.PAYMENTS, paymentData);
    return response.data;
  }

  /**
   * Get payment by ID
   */
  async getPayment(paymentId: string): Promise<RapydPayment> {
    const response = await this.makeRequest<RapydPayment>('GET', `${RAPYD_ENDPOINTS.PAYMENTS}/${paymentId}`);
    return response.data;
  }

  /**
   * Create a refund
   */
  async createRefund(refundData: {
    payment: string;
    amount: number;
    currency: string;
    merchant_reference_id: string;
    description?: string;
  }): Promise<RapydRefund> {
    const response = await this.makeRequest<RapydRefund>('POST', RAPYD_ENDPOINTS.REFUNDS, refundData);
    return response.data;
  }

  /**
   * Get refund by ID
   */
  async getRefund(refundId: string): Promise<RapydRefund> {
    const response = await this.makeRequest<RapydRefund>('GET', `${RAPYD_ENDPOINTS.REFUNDS}/${refundId}`);
    return response.data;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    const expectedSignature = crypto.HmacSHA256(
      payload + timestamp,
      this.secretKey
    ).toString(crypto.enc.Hex);
    
    // Simple string comparison for webhook verification
    return signature === expectedSignature;
  }

  /**
   * Handle webhook events
   */
  async handleWebhookEvent(event: any): Promise<{ success: boolean; message: string }> {
    try {
      switch (event.type) {
        case 'CHECKOUT_COMPLETED':
          // Handle successful checkout
          console.log('Checkout completed:', event.data);
          break;
        case 'PAYMENT_COMPLETED':
          // Handle successful payment
          console.log('Payment completed:', event.data);
          break;
        case 'PAYMENT_FAILED':
          // Handle failed payment
          console.log('Payment failed:', event.data);
          break;
        case 'REFUND_COMPLETED':
          // Handle successful refund
          console.log('Refund completed:', event.data);
          break;
        default:
          console.log('Unknown webhook event:', event.type);
      }

      return { success: true, message: 'Webhook processed successfully' };
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Process webhook (alias for handleWebhookEvent)
   */
  async processWebhook(payload: any): Promise<{ success: boolean; message: string }> {
    return await this.handleWebhookEvent(payload);
  }
}

// Singleton instance
let rapydService: RapydService;

export const getRapydService = (): RapydService => {
  if (!rapydService) {
    rapydService = new RapydService();
  }
  return rapydService;
};

export default RapydService;
