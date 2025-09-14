import express from 'express';
import { PrismaClient } from '@prisma/client';
import { getRapydService } from '../services/rapydService';
import MockPaymentService from '../services/mockPaymentService';
import { authenticateToken } from '../middleware/auth';
import { body, param, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to determine which payment service to use
const getPaymentService = () => {
  try {
    const rapydService = getRapydService();
    // Try to check if Rapyd is configured by making a simple request
    if (rapydService && process.env.RAPYD_ACCESS_KEY && process.env.RAPYD_SECRET_KEY) {
      return { service: rapydService, isMock: false };
    }
  } catch (error) {
    console.log('🎭 Rapyd service not available, using mock service');
  }
  
  return { service: MockPaymentService.getInstance(), isMock: true };
};

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }
  next();
};

/**
 * @route   POST /api/payments/customers
 * @desc    Create a Rapyd customer
 * @access  Private
 */
router.post('/customers', 
  authenticateToken,
  [
    body('email').isEmail().normalizeEmail(),
    body('name').trim().isLength({ min: 2, max: 100 }),
    body('phone_number').optional().isMobilePhone('any'),
    body('address.line1').optional().trim().isLength({ min: 1, max: 200 }),
    body('address.city').optional().trim().isLength({ min: 1, max: 100 }),
    body('address.state').optional().trim().isLength({ min: 1, max: 100 }),
    body('address.country').optional().trim().isLength({ min: 2, max: 2 }),
    body('address.zip').optional().trim().isLength({ min: 1, max: 20 })
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { email, name, phone_number, address } = req.body;
      const userId = (req as any).user.id;

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: { message: 'User not found' }
        });
      }

      const rapydService = getRapydService();
      const customerData = {
        email: email || user.email,
        name: name || `${user.firstName} ${user.lastName}`,
        phone_number,
        address
      };

      const customer = await rapydService.createCustomer(customerData);

      // Update user with Rapyd customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { rapydCustomerId: customer.id }
      });

      res.json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create customer' }
      });
    }
  }
);

/**
 * @route   GET /api/payments/customers/:id
 * @desc    Get Rapyd customer by ID
 * @access  Private
 */
router.get('/customers/:id',
  authenticateToken,
  [param('id').isString().trim().isLength({ min: 1 })],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const rapydService = getRapydService();
      const customer = await rapydService.getCustomer(id);

      res.json({
        success: true,
        data: customer
      });
    } catch (error: any) {
      console.error('Error getting customer:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get customer' }
      });
    }
  }
);

/**
 * @route   GET /api/payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods',
  async (req: express.Request, res: express.Response) => {
    try {
      const { country = 'US', currency = 'USD' } = req.query;
      const { service, isMock } = getPaymentService();
      
      if (isMock) {
        console.log('🎭 Using mock payment service for methods');
        const paymentMethods = service.getPaymentMethods(country as string, currency as string);
        return res.json({
          success: true,
          data: paymentMethods,
          mock: true,
          message: 'Using mock payment service - Rapyd account inactive'
        });
      }

      const paymentMethods = await service.getPaymentMethods(country as string, currency as string);
      res.json({
        success: true,
        data: paymentMethods
      });
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get payment methods' }
      });
    }
  }
);

/**
 * @route   POST /api/payments/checkout
 * @desc    Create a checkout page
 * @access  Private
 */
router.post('/checkout',
  authenticateToken,
  [
    body('orderId').isString().trim().isLength({ min: 1 }),
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('currency').isString().isLength({ min: 3, max: 3 }),
    body('redirect_url').isURL(),
    body('complete_payment_url').isURL(),
    body('cancel_payment_url').isURL(),
    body('description').optional().trim().isLength({ max: 500 })
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { orderId, amount, currency, redirect_url, complete_payment_url, cancel_payment_url, description } = req.body;
      const userId = (req as any).user.id;

      // Get order from database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: { message: 'Order not found' }
        });
      }

      // Check if user owns the order
      if (order.customerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }

      // Get or create Rapyd customer
      let customerId = order.customer.rapydCustomerId;
      if (!customerId) {
        const rapydService = getRapydService();
        const customer = await rapydService.createCustomer({
          email: order.customer.email,
          name: `${order.customer.firstName} ${order.customer.lastName}`
        });
        customerId = customer.id;

        // Update user with Rapyd customer ID
        await prisma.user.update({
          where: { id: order.customerId },
          data: { rapydCustomerId: customerId }
        });
      }

      const { service, isMock } = getPaymentService();
      
      if (isMock) {
        console.log('🎭 Using mock payment service for checkout');
        const checkoutData = {
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          merchant_reference_id: order.orderNumber,
          customer: 'mock_customer',
          redirect_url: redirect_url,
          complete_payment_url: complete_payment_url,
          cancel_payment_url: cancel_payment_url,
          description: description || `Payment for order ${order.orderNumber}`,
          metadata: {
            orderId: order.id,
            userId: userId
          }
        };

        const checkoutPage = await service.createCheckoutPage(checkoutData);
        
        // Update order with mock checkout ID
        await prisma.order.update({
          where: { id: orderId },
          data: { rapydCheckoutId: (checkoutPage as any).checkoutId || (checkoutPage as any).id }
        });

        return res.json({
          success: true,
          data: checkoutPage,
          mock: true,
          message: 'Mock checkout created - Rapyd account inactive'
        });
      }

      const checkoutData = {
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        merchant_reference_id: order.orderNumber,
        customer: customerId,
        redirect_url,
        complete_payment_url,
        cancel_payment_url,
        description: description || `Payment for order ${order.orderNumber}`,
        metadata: {
          orderId: order.id,
          userId: userId
        }
      };

      const checkoutPage = await service.createCheckoutPage(checkoutData);

      // Update order with checkout page ID
      await prisma.order.update({
        where: { id: orderId },
        data: { rapydCheckoutId: (checkoutPage as any).checkoutId || (checkoutPage as any).id }
      });

      res.json({
        success: true,
        data: checkoutPage,
        message: 'Checkout page created successfully'
      });
    } catch (error: any) {
      console.error('Error creating checkout page:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create checkout page' }
      });
    }
  }
);

/**
 * @route   GET /api/payments/checkout/:id
 * @desc    Get checkout page by ID
 * @access  Private
 */
router.get('/checkout/:id',
  authenticateToken,
  [param('id').isString().trim().isLength({ min: 1 })],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const rapydService = getRapydService();
      const checkoutPage = await rapydService.getCheckoutPage(id);

      res.json({
        success: true,
        data: checkoutPage
      });
    } catch (error: any) {
      console.error('Error getting checkout page:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get checkout page' }
      });
    }
  }
);

/**
 * @route   GET /api/payments/:id
 * @desc    Get payment by ID
 * @access  Private
 */
router.get('/:id',
  authenticateToken,
  [param('id').isString().trim().isLength({ min: 1 })],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const rapydService = getRapydService();
      const payment = await rapydService.getPayment(id);

      res.json({
        success: true,
        data: payment
      });
    } catch (error: any) {
      console.error('Error getting payment:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to get payment' }
      });
    }
  }
);

/**
 * @route   POST /api/payments/refund
 * @desc    Create a refund
 * @access  Private
 */
router.post('/refund',
  authenticateToken,
  [
    body('paymentId').isString().trim().isLength({ min: 1 }),
    body('amount').isNumeric().isFloat({ min: 0.01 }),
    body('reason').optional().trim().isLength({ max: 500 })
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { paymentId, amount, reason } = req.body;
      const userId = (req as any).user.id;

      // Get payment from Rapyd
      const rapydService = getRapydService();
      const payment = await rapydService.getPayment(paymentId);

      // Find order by payment ID
      const order = await prisma.order.findFirst({
        where: { rapydPaymentId: paymentId },
        include: { customer: true }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: { message: 'Order not found for this payment' }
        });
      }

      // Check if user owns the order
      if (order.customerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }

      const refundData = {
        payment: paymentId,
        amount: parseFloat(amount),
        currency: payment.currency,
        merchant_reference_id: `refund_${order.orderNumber}_${Date.now()}`,
        description: reason || `Refund for order ${order.orderNumber}`
      };

      const refund = await rapydService.createRefund(refundData);

      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { 
          paymentStatus: 'REFUNDED',
          rapydRefundId: refund.id
        }
      });

      res.json({
        success: true,
        data: refund,
        message: 'Refund created successfully'
      });
    } catch (error: any) {
      console.error('Error creating refund:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to create refund' }
      });
    }
  }
);

/**
 * @route   POST /api/payments/complete
 * @desc    Complete payment and update order status
 * @access  Private
 */
router.post('/complete',
  authenticateToken,
  [
    body('orderId').isString().trim().isLength({ min: 1 }),
    body('paymentId').isString().trim().isLength({ min: 1 }),
    body('status').isIn(['completed', 'pending', 'failed']),
    body('amount').isNumeric().isFloat({ min: 0.01 })
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const { orderId, paymentId, status, amount } = req.body;
      const userId = (req as any).user.id;

      // Get order from database
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order) {
        return res.status(404).json({
          success: false,
          error: { message: 'Order not found' }
        });
      }

      // Check if user owns the order
      if (order.customerId !== userId) {
        return res.status(403).json({
          success: false,
          error: { message: 'Access denied' }
        });
      }

      // Update order with payment information
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: status.toUpperCase(),
          rapydPaymentId: paymentId,
          ...(status === 'completed' && { status: 'CONFIRMED' })
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          items: true
        }
      });

      res.json({
        success: true,
        data: updatedOrder,
        message: `Payment ${status} successfully`
      });
    } catch (error: any) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        error: { message: error.message || 'Failed to complete payment' }
      });
    }
  }
);

/**
 * @route   POST /api/payments/webhook
 * @desc    Handle Rapyd webhooks
 * @access  Public
 */
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req: express.Request, res: express.Response) => {
    try {
      const { service, isMock } = getPaymentService();
      
      if (isMock) {
        console.log('🎭 Processing mock webhook');
        const payload = req.body.toString();
        const result = service.processWebhook(JSON.parse(payload));
        return res.json({ 
          success: true, 
          message: 'Mock webhook processed',
          mock: true 
        });
      }

      const signature = req.headers['rapyd-signature'] as string;
      const timestamp = req.headers['rapyd-timestamp'] as string;
      const payload = req.body.toString();

      if (!signature || !timestamp) {
        return res.status(400).json({
          success: false,
          error: { message: 'Missing signature or timestamp' }
        });
      }

      const isValidSignature = service.verifyWebhookSignature(payload, signature, timestamp);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          error: { message: 'Invalid signature' }
        });
      }

      const event = JSON.parse(payload);
      const result = await service.handleWebhookEvent(event);

      if (result.success) {
        // Update order status based on webhook event
        if (event.type === 'PAYMENT_COMPLETED' && event.data?.merchant_reference_id) {
          const order = await prisma.order.findUnique({
            where: { orderNumber: event.data.merchant_reference_id }
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: {
                paymentStatus: 'COMPLETED',
                rapydPaymentId: event.data.id
              }
            });
          }
        }
      }

      res.json({ success: true, message: 'Webhook processed' });
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Webhook processing failed' }
      });
    }
  }
);

export default router;
