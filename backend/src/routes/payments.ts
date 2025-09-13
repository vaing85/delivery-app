import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { getPaymentService } from '../services/paymentService';
import { getStripeService } from '../services/stripeService';

const router = express.Router();
const prisma = new PrismaClient();

// Create payment intent
router.post('/create-intent', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    if (order.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    // Create or get Stripe customer
    const stripeService = getStripeService();
    const customerResult = await stripeService.createOrGetCustomer({
      id: customerId,
      email: order.customer.email,
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
      phone: order.customer.phone || undefined
    });

    if (!customerResult.success || !customerResult.customerId) {
      return res.status(400).json({
        success: false,
        error: { message: customerResult.error || 'Failed to create customer' }
      });
    }

    // Create payment intent
    const paymentIntentResult = await stripeService.createPaymentIntent({
      amount: order.total,
      currency: 'USD',
      customerId: customerResult.customerId,
      orderId,
      description: `Payment for order #${order.orderNumber}`,
      metadata: {
        orderNumber: order.orderNumber
      }
    });

    if (paymentIntentResult.success) {
      res.json({
        success: true,
        data: {
          paymentIntentId: paymentIntentResult.paymentIntentId,
          clientSecret: paymentIntentResult.clientSecret,
          orderId,
          amount: order.total
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: paymentIntentResult.error || 'Failed to create payment intent' }
      });
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Process customer payment
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const { orderId, amount, paymentMethodId } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    if (order.customerId !== customerId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    // Process payment
    const paymentService = getPaymentService();
    const result = await paymentService.processPayment({
      amount: order.total,
      currency: 'USD',
      customerId,
      orderId,
      paymentMethodId,
      description: `Payment for order #${order.orderNumber}`
    });

    if (result.success) {
      // Update order payment status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: 'PAID',
          paymentMethod: 'CARD'
        }
      });

      res.json({
        success: true,
        data: {
          paymentIntentId: result.paymentIntentId,
          clientSecret: result.clientSecret,
          orderId,
          amount: order.total
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Payment processing failed' }
      });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Confirm payment
router.post('/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const paymentService = getPaymentService();
    const result = await paymentService.confirmPayment(paymentIntentId);

    if (result.success) {
      res.json({
        success: true,
        data: {
          status: result.status,
          paymentIntentId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Payment confirmation failed' }
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get driver earnings
router.get('/driver/earnings', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const paymentService = getPaymentService();
    const earnings = await paymentService.getDriverEarnings(driverId, period as string);

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    console.error('Error getting driver earnings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get driver payout history
router.get('/driver/payouts', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (req.user?.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const paymentService = getPaymentService();
    const payouts = await paymentService.getPayoutHistory(driverId, period as string);

    res.json({
      success: true,
      data: { payouts }
    });
  } catch (error) {
    console.error('Error getting driver payouts:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Process driver payout (admin only)
router.post('/driver/payout', authenticateToken, async (req, res) => {
  try {
    const { driverId, amount, period, deliveryIds } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const paymentService = getPaymentService();
    const result = await paymentService.processDriverPayout({
      driverId,
      amount,
      currency: 'USD',
      period,
      deliveries: deliveryIds
    });

    if (result.success) {
      res.json({
        success: true,
        data: {
          payoutId: result.payoutId,
          driverId,
          amount,
          period
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Payout processing failed' }
      });
    }
  } catch (error) {
    console.error('Error processing driver payout:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Create payment method
router.post('/payment-method', authenticateToken, async (req, res) => {
  try {
    const { card } = req.body;
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Get user details for Stripe customer creation
    const user = await prisma.user.findUnique({
      where: { id: customerId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    const stripeService = getStripeService();
    
    // Create or get Stripe customer
    const customerResult = await stripeService.createOrGetCustomer({
      id: customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || undefined
    });

    if (!customerResult.success || !customerResult.customerId) {
      return res.status(400).json({
        success: false,
        error: { message: customerResult.error || 'Failed to create customer' }
      });
    }

    // Create payment method
    const paymentMethodResult = await stripeService.createPaymentMethod(card, customerResult.customerId);

    if (paymentMethodResult.success && paymentMethodResult.paymentMethodId) {
      // Attach payment method to customer
      const attachResult = await stripeService.attachPaymentMethod(
        paymentMethodResult.paymentMethodId, 
        customerResult.customerId
      );

      if (attachResult.success) {
        res.json({
          success: true,
          data: {
            paymentMethodId: paymentMethodResult.paymentMethodId
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: { message: attachResult.error || 'Failed to attach payment method' }
        });
      }
    } else {
      res.status(400).json({
        success: false,
        error: { message: paymentMethodResult.error || 'Failed to create payment method' }
      });
    }
  } catch (error) {
    console.error('Error creating payment method:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get customer payment methods
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user?.id;

    if (!customerId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        stripeCustomerId: true
      }
    });

    if (!user?.stripeCustomerId) {
      return res.json({
        success: true,
        data: { paymentMethods: [] }
      });
    }

    const stripeService = getStripeService();
    const result = await stripeService.getCustomerPaymentMethods(user.stripeCustomerId);

    if (result.success) {
      res.json({
        success: true,
        data: { paymentMethods: result.paymentMethods || [] }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Failed to get payment methods' }
      });
    }
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.log('Stripe webhook secret not configured, skipping webhook verification');
      return res.json({ received: true });
    }

    const stripeService = getStripeService();
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err}`);
    }

    // Handle the event
    const result = await stripeService.handleWebhookEvent(event);
    
    if (result.success) {
      res.json({ received: true });
    } else {
      console.error('Webhook handling failed:', result.error);
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Process refund
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Only admin can process refunds
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const paymentService = getPaymentService();
    const result = await paymentService.refundPayment(paymentIntentId, amount);

    if (result.success) {
      res.json({
        success: true,
        data: {
          refundId: result.refundId,
          paymentIntentId,
          amount
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Refund processing failed' }
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
