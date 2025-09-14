import { Request, Response } from 'express';

export interface MockPaymentMethod {
  id: string;
  type: string;
  name: string;
  image: string;
  description: string;
}

export interface MockCheckoutResponse {
  success: boolean;
  checkoutId: string;
  checkoutUrl: string;
  expiresAt: string;
}

export interface MockPaymentResult {
  success: boolean;
  paymentId: string;
  status: 'completed' | 'pending' | 'failed';
  message: string;
}

export class MockPaymentService {
  private static instance: MockPaymentService;
  
  public static getInstance(): MockPaymentService {
    if (!MockPaymentService.instance) {
      MockPaymentService.instance = new MockPaymentService();
    }
    return MockPaymentService.instance;
  }

  /**
   * Get mock payment methods for a country/currency
   */
  getPaymentMethods(country: string, currency: string): MockPaymentMethod[] {
    console.log(`🎭 MockPaymentService: Getting payment methods for ${country}/${currency}`);
    
    const methods: MockPaymentMethod[] = [
      {
        id: 'mock_card_visa',
        type: 'card',
        name: 'Visa Card',
        image: 'https://via.placeholder.com/50x30/1A1F71/FFFFFF?text=VISA',
        description: 'Pay with Visa credit or debit card'
      },
      {
        id: 'mock_card_mastercard',
        type: 'card',
        name: 'Mastercard',
        image: 'https://via.placeholder.com/50x30/EB001B/FFFFFF?text=MC',
        description: 'Pay with Mastercard credit or debit card'
      },
      {
        id: 'mock_paypal',
        type: 'ewallet',
        name: 'PayPal',
        image: 'https://via.placeholder.com/50x30/0070BA/FFFFFF?text=PP',
        description: 'Pay with your PayPal account'
      },
      {
        id: 'mock_bank_transfer',
        type: 'bank_transfer',
        name: 'Bank Transfer',
        image: 'https://via.placeholder.com/50x30/28A745/FFFFFF?text=BT',
        description: 'Direct bank transfer'
      }
    ];

    // Filter based on country/currency if needed
    if (country === 'US') {
      methods.push({
        id: 'mock_apple_pay',
        type: 'mobile',
        name: 'Apple Pay',
        image: 'https://via.placeholder.com/50x30/000000/FFFFFF?text=AP',
        description: 'Pay with Apple Pay'
      });
    }

    return methods;
  }

  /**
   * Create mock checkout page (matches RapydService interface)
   */
  async createCheckoutPage(data: {
    amount: number;
    currency: string;
    merchant_reference_id: string;
    customer: string;
    redirect_url: string;
    complete_payment_url: string;
    cancel_payment_url: string;
    description: string;
    metadata?: any;
  }): Promise<MockCheckoutResponse> {
    console.log(`🎭 MockPaymentService: Creating checkout page for ${data.amount} ${data.currency}`);
    
    const checkoutId = `mock_checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = data.redirect_url;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    return {
      success: true,
      checkoutId,
      checkoutUrl,
      expiresAt
    };
  }

  /**
   * Create mock checkout session (legacy method)
   */
  createCheckout(data: {
    amount: number;
    currency: string;
    country: string;
    paymentMethod: string;
    customerInfo: any;
  }): MockCheckoutResponse {
    console.log(`🎭 MockPaymentService: Creating checkout for ${data.amount} ${data.currency}`);
    
    const checkoutId = `mock_checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const checkoutUrl = `http://localhost:3000/mock-checkout/${checkoutId}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    return {
      success: true,
      checkoutId,
      checkoutUrl,
      expiresAt
    };
  }

  /**
   * Process mock payment
   */
  processPayment(checkoutId: string, paymentData: any): MockPaymentResult {
    console.log(`🎭 MockPaymentService: Processing payment for checkout ${checkoutId}`);
    
    // Simulate different payment outcomes
    const random = Math.random();
    
    if (random < 0.8) {
      // 80% success rate
      return {
        success: true,
        paymentId: `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'completed',
        message: 'Payment completed successfully'
      };
    } else if (random < 0.95) {
      // 15% pending rate
      return {
        success: true,
        paymentId: `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        message: 'Payment is being processed'
      };
    } else {
      // 5% failure rate
      return {
        success: false,
        paymentId: `mock_payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'failed',
        message: 'Payment failed - insufficient funds'
      };
    }
  }

  /**
   * Get mock checkout page (matches RapydService interface)
   */
  async getCheckoutPage(checkoutId: string): Promise<MockCheckoutResponse> {
    console.log(`🎭 MockPaymentService: Getting checkout page ${checkoutId}`);
    
    return {
      success: true,
      checkoutId,
      checkoutUrl: `http://localhost:3000/mock-checkout/${checkoutId}`,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };
  }

  /**
   * Create mock customer (matches RapydService interface)
   */
  async createCustomer(customerData: {
    email: string;
    name: string;
    phone_number?: string;
    address?: any;
  }): Promise<{ id: string; email: string; name: string }> {
    console.log(`🎭 MockPaymentService: Creating customer ${customerData.email}`);
    
    return {
      id: `mock_customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: customerData.email,
      name: customerData.name
    };
  }

  /**
   * Get mock customer (matches RapydService interface)
   */
  async getCustomer(customerId: string): Promise<{ id: string; email: string; name: string }> {
    console.log(`🎭 MockPaymentService: Getting customer ${customerId}`);
    
    return {
      id: customerId,
      email: 'mock@example.com',
      name: 'Mock Customer'
    };
  }

  /**
   * Create mock payment (matches RapydService interface)
   */
  async createPayment(paymentData: any): Promise<MockPaymentResult> {
    console.log(`🎭 MockPaymentService: Creating payment`);
    
    return this.processPayment('mock_checkout', paymentData);
  }

  /**
   * Get mock payment (matches RapydService interface)
   */
  async getPayment(paymentId: string): Promise<MockPaymentResult> {
    console.log(`🎭 MockPaymentService: Getting payment ${paymentId}`);
    
    return {
      success: true,
      paymentId,
      status: 'completed',
      message: 'Payment retrieved successfully'
    };
  }

  /**
   * Create mock refund (matches RapydService interface)
   */
  async createRefund(refundData: any): Promise<{ id: string; status: string; amount: number }> {
    console.log(`🎭 MockPaymentService: Creating refund`);
    
    return {
      id: `mock_refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      amount: refundData.amount || 0
    };
  }

  /**
   * Get mock refund (matches RapydService interface)
   */
  async getRefund(refundId: string): Promise<{ id: string; status: string; amount: number }> {
    console.log(`🎭 MockPaymentService: Getting refund ${refundId}`);
    
    return {
      id: refundId,
      status: 'completed',
      amount: 0
    };
  }

  /**
   * Handle mock webhook event (matches RapydService interface)
   */
  async handleWebhookEvent(event: any): Promise<{ success: boolean; message: string }> {
    console.log(`🎭 MockPaymentService: Handling webhook event`, event);
    
    return {
      success: true,
      message: 'Webhook event processed successfully'
    };
  }

  /**
   * Verify mock webhook
   */
  verifyWebhook(signature: string, payload: string): boolean {
    console.log(`🎭 MockPaymentService: Verifying webhook signature`);
    // Always return true for mock service
    return true;
  }

  /**
   * Verify mock webhook signature (matches RapydService interface)
   */
  verifyWebhookSignature(payload: string, signature: string, timestamp: string): boolean {
    console.log(`🎭 MockPaymentService: Verifying webhook signature`);
    // Always return true for mock service
    return true;
  }

  /**
   * Process mock webhook
   */
  processWebhook(payload: any): { success: boolean; message: string } {
    console.log(`🎭 MockPaymentService: Processing webhook`, payload);
    
    return {
      success: true,
      message: 'Webhook processed successfully'
    };
  }
}

export default MockPaymentService;
