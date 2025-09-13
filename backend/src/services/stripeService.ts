import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil'
}) : null;

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface PaymentIntentData {
  amount: number;
  currency: string;
  customerId: string;
  orderId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export class StripeService {
  // Create or retrieve Stripe customer
  async createOrGetCustomer(userData: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<{ success: boolean; customerId?: string; error?: string }> {
    try {
      if (!stripe) {
        return {
          success: true,
          customerId: `cus_mock_${userData.id}`
        };
      }

      // Check if customer already exists in our database
      const existingCustomer = await prisma.user.findUnique({
        where: { id: userData.id },
        select: { stripeCustomerId: true }
      });

      if (existingCustomer?.stripeCustomerId) {
        // Verify customer still exists in Stripe
        try {
          await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
          return {
            success: true,
            customerId: existingCustomer.stripeCustomerId
          };
        } catch (error) {
          // Customer doesn't exist in Stripe, create new one
        }
      }

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userData.email,
        name: userData.firstName && userData.lastName 
          ? `${userData.firstName} ${userData.lastName}` 
          : undefined,
        phone: userData.phone,
        metadata: {
          userId: userData.id
        }
      });

      // Update user record with Stripe customer ID
      await prisma.user.update({
        where: { id: userData.id },
        data: { stripeCustomerId: customer.id }
      });

      return {
        success: true,
        customerId: customer.id
      };
    } catch (error) {
      console.error('Error creating Stripe customer:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create customer'
      };
    }
  }

  // Create payment intent
  async createPaymentIntent(data: PaymentIntentData): Promise<{
    success: boolean;
    paymentIntentId?: string;
    clientSecret?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        // Mock payment intent for development
        return {
          success: true,
          paymentIntentId: `pi_mock_${Date.now()}`,
          clientSecret: `pi_mock_${Date.now()}_secret_mock`
        };
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency.toLowerCase(),
        customer: data.customerId,
        payment_method: data.paymentMethodId,
        description: data.description || `Payment for order ${data.orderId}`,
        metadata: {
          orderId: data.orderId,
          userId: data.customerId,
          ...data.metadata
        },
        automatic_payment_methods: {
          enabled: true
        },
        confirmation_method: 'manual',
        confirm: false
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent'
      };
    }
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        return {
          success: true,
          status: 'succeeded'
        };
      }

      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId
      });

      return {
        success: true,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to confirm payment'
      };
    }
  }

  // Create payment method
  async createPaymentMethod(cardData: {
    number: string;
    exp_month: number;
    exp_year: number;
    cvc: string;
    name: string;
  }, customerId?: string): Promise<{
    success: boolean;
    paymentMethodId?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        return {
          success: true,
          paymentMethodId: `pm_mock_${Date.now()}`
        };
      }

      const paymentMethod = await stripe.paymentMethods.create({
        type: 'card',
        card: cardData,
        customer: customerId
      });

      return {
        success: true,
        paymentMethodId: paymentMethod.id
      };
    } catch (error) {
      console.error('Error creating payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment method'
      };
    }
  }

  // Attach payment method to customer
  async attachPaymentMethod(paymentMethodId: string, customerId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!stripe) {
        return { success: true };
      }

      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return { success: true };
    } catch (error) {
      console.error('Error attaching payment method:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to attach payment method'
      };
    }
  }

  // Get customer payment methods
  async getCustomerPaymentMethods(customerId: string): Promise<{
    success: boolean;
    paymentMethods?: StripePaymentMethod[];
    error?: string;
  }> {
    try {
      if (!stripe) {
        // Return mock payment methods
        return {
          success: true,
          paymentMethods: [
            {
              id: 'pm_mock_1',
              type: 'card',
              card: {
                brand: 'visa',
                last4: '4242',
                exp_month: 12,
                exp_year: 2025
              }
            }
          ]
        };
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      });

      return {
        success: true,
        paymentMethods: paymentMethods.data.map(pm => ({
          id: pm.id,
          type: pm.type,
          card: pm.card ? {
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year
          } : undefined
        }))
      };
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payment methods'
      };
    }
  }

  // Process refund
  async processRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        return {
          success: true,
          refundId: `re_mock_${Date.now()}`
        };
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as any
      });

      return {
        success: true,
        refundId: refund.id
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process refund'
      };
    }
  }

  // Handle webhook events
  async handleWebhookEvent(event: Stripe.Event): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_method.attached':
          await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error handling webhook event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to handle webhook event'
      };
    }
  }

  // Handle successful payment
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) return;

      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'CARD',
          stripePaymentIntentId: paymentIntent.id
        }
      });

      console.log(`Payment succeeded for order ${orderId}`);
    } catch (error) {
      console.error('Error handling payment success:', error);
    }
  }

  // Handle failed payment
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const orderId = paymentIntent.metadata?.orderId;
      if (!orderId) return;

      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'FAILED',
          stripePaymentIntentId: paymentIntent.id
        }
      });

      console.log(`Payment failed for order ${orderId}`);
    } catch (error) {
      console.error('Error handling payment failure:', error);
    }
  }

  // Handle payment method attached
  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    try {
      console.log(`Payment method ${paymentMethod.id} attached to customer ${paymentMethod.customer}`);
    } catch (error) {
      console.error('Error handling payment method attachment:', error);
    }
  }
}

// Export singleton instance
let stripeService: StripeService;

export const getStripeService = () => {
  if (!stripeService) {
    stripeService = new StripeService();
  }
  return stripeService;
};
