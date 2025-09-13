import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil'
}) : null;

export interface PaymentData {
  amount: number;
  currency: string;
  customerId: string;
  orderId: string;
  paymentMethodId?: string;
  description?: string;
}

export interface DriverPayout {
  driverId: string;
  amount: number;
  currency: string;
  period: string;
  deliveries: string[];
}

export class PaymentService {
  // Process customer payment
  async processPayment(paymentData: PaymentData): Promise<{
    success: boolean;
    paymentIntentId?: string;
    clientSecret?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        // Mock payment processing for development
        return this.mockPaymentProcessing(paymentData);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(paymentData.amount * 100), // Convert to cents
        currency: paymentData.currency,
        customer: paymentData.customerId,
        payment_method: paymentData.paymentMethodId,
        description: paymentData.description || `Payment for order ${paymentData.orderId}`,
        metadata: {
          orderId: paymentData.orderId,
          customerId: paymentData.customerId
        },
        automatic_payment_methods: {
          enabled: true
        }
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      };
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId: string): Promise<{
    success: boolean;
    status?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        // Mock confirmation for development
        return { success: true, status: 'succeeded' };
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      return {
        success: true,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment confirmation failed'
      };
    }
  }

  // Process driver payout
  async processDriverPayout(payoutData: DriverPayout): Promise<{
    success: boolean;
    payoutId?: string;
    error?: string;
  }> {
    try {
      if (!stripe) {
        // Mock payout processing for development
        return this.mockPayoutProcessing(payoutData);
      }

      // Get driver's Stripe account
      const driver = await prisma.user.findUnique({
        where: { id: payoutData.driverId },
        include: {
          driverProfile: true
        }
      });

      if (!driver?.driverProfile) {
        throw new Error('Driver profile not found');
      }

      // Create transfer to driver's account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payoutData.amount * 100), // Convert to cents
        currency: payoutData.currency,
        destination: (driver.driverProfile as any).stripeAccountId || 'acct_mock_driver', // Would be stored in driver profile
        description: `Payout for ${payoutData.period} - ${payoutData.deliveries.length} deliveries`,
        metadata: {
          driverId: payoutData.driverId,
          period: payoutData.period,
          deliveryCount: payoutData.deliveries.length.toString()
        }
      });

      // Record payout in database
      await this.recordPayout({
        driverId: payoutData.driverId,
        amount: payoutData.amount,
        currency: payoutData.currency,
        stripeTransferId: transfer.id,
        period: payoutData.period,
        deliveryIds: payoutData.deliveries
      });

      return {
        success: true,
        payoutId: transfer.id
      };
    } catch (error) {
      console.error('Error processing driver payout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payout processing failed'
      };
    }
  }

  // Get driver earnings summary
  async getDriverEarnings(driverId: string, period: string = '30d'): Promise<{
    totalEarnings: number;
    completedDeliveries: number;
    pendingPayout: number;
    lastPayoutDate: Date | null;
    earningsByPeriod: any[];
  }> {
    try {
      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get completed deliveries with earnings
      const deliveries = await prisma.delivery.findMany({
        where: {
          driverId,
          status: 'DELIVERED',
          createdAt: { gte: startDate }
        },
        include: {
          order: {
            select: {
              deliveryFee: true,
              tip: true,
              actualDelivery: true
            }
          }
        }
      });

      // Calculate earnings
      const totalEarnings = deliveries.reduce((sum, d) => {
        return sum + (d.order.deliveryFee || 0) + (d.order.tip || 0);
      }, 0);

      // Get payout history
      const payouts = await this.getPayoutHistory(driverId, period);
      const lastPayoutDate = payouts.length > 0 ? payouts[0].createdAt : null;

      // Calculate pending payout (earnings not yet paid out)
      const paidOutAmount = payouts.reduce((sum, payout) => sum + payout.amount, 0);
      const pendingPayout = Math.max(0, totalEarnings - paidOutAmount);

      // Group earnings by day/week
      const earningsByPeriod = this.groupEarningsByPeriod(deliveries, period);

      return {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        completedDeliveries: deliveries.length,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        lastPayoutDate,
        earningsByPeriod
      };
    } catch (error) {
      console.error('Error getting driver earnings:', error);
      throw error;
    }
  }

  // Get payout history
  async getPayoutHistory(driverId: string, period: string = '30d'): Promise<any[]> {
    try {
      // This would query a payouts table in a real implementation
      // For now, return mock data
      return [
        {
          id: 'payout_1',
          amount: 150.00,
          currency: 'USD',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          deliveryCount: 5
        },
        {
          id: 'payout_2',
          amount: 200.00,
          currency: 'USD',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
          deliveryCount: 7
        }
      ];
    } catch (error) {
      console.error('Error getting payout history:', error);
      return [];
    }
  }

  // Record payout in database
  private async recordPayout(payoutData: {
    driverId: string;
    amount: number;
    currency: string;
    stripeTransferId: string;
    period: string;
    deliveryIds: string[];
  }): Promise<void> {
    try {
      // In a real implementation, this would save to a payouts table
      console.log('Payout recorded:', payoutData);
    } catch (error) {
      console.error('Error recording payout:', error);
      throw error;
    }
  }

  // Group earnings by period
  private groupEarningsByPeriod(deliveries: any[], period: string): any[] {
    const groups: { [key: string]: { earnings: number; count: number } } = {};

    deliveries.forEach(delivery => {
      const date = new Date(delivery.order.actualDelivery || delivery.createdAt);
      let key: string;

      if (period === '7d') {
        key = date.toISOString().split('T')[0]; // Daily
      } else if (period === '30d') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0]; // Weekly
      } else {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        key = monthStart.toISOString().split('T')[0]; // Monthly
      }

      if (!groups[key]) {
        groups[key] = { earnings: 0, count: 0 };
      }

      groups[key].earnings += (delivery.order.deliveryFee || 0) + (delivery.order.tip || 0);
      groups[key].count += 1;
    });

    return Object.entries(groups).map(([date, data]) => ({
      date,
      earnings: Math.round(data.earnings * 100) / 100,
      deliveryCount: data.count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Mock payment processing for development
  private mockPaymentProcessing(paymentData: PaymentData): {
    success: boolean;
    paymentIntentId?: string;
    clientSecret?: string;
    error?: string;
  } {
    // Simulate payment processing delay
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      return {
        success: true,
        paymentIntentId: `pi_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret_mock`
      };
    } else {
      return {
        success: false,
        error: 'Mock payment failed - insufficient funds'
      };
    }
  }

  // Mock payout processing for development
  private mockPayoutProcessing(payoutData: DriverPayout): {
    success: boolean;
    payoutId?: string;
    error?: string;
  } {
    const success = Math.random() > 0.05; // 95% success rate

    if (success) {
      return {
        success: true,
        payoutId: `tr_mock_${Date.now()}`
      };
    } else {
      return {
        success: false,
        error: 'Mock payout failed - account verification required'
      };
    }
  }

  // Create customer payment method
  async createPaymentMethod(customerId: string, paymentMethodData: any): Promise<{
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
        card: paymentMethodData.card,
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

  // Refund payment
  async refundPayment(paymentIntentId: string, amount?: number): Promise<{
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
        amount: amount ? Math.round(amount * 100) : undefined // Convert to cents
      });

      return {
        success: true,
        refundId: refund.id
      };
    } catch (error) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Refund processing failed'
      };
    }
  }
}

// Export singleton instance
let paymentService: PaymentService;

export const getPaymentService = () => {
  if (!paymentService) {
    paymentService = new PaymentService();
  }
  return paymentService;
};
