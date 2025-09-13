import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateSignature = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('signatureData').notEmpty().withMessage('Signature data is required'),
  body('signatureType').optional().isIn(['CUSTOMER', 'DRIVER', 'WITNESS']).withMessage('Invalid signature type'),
  body('ipAddress').optional().isString().withMessage('IP address must be a string'),
  body('userAgent').optional().isString().withMessage('User agent must be a string'),
  body('location').optional().isString().withMessage('Location must be a string')
];

// @route   GET /api/signatures
// @desc    Get all signatures with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('orderId').optional().isString().withMessage('Order ID must be a string'),
  query('userId').optional().isString().withMessage('User ID must be a string'),
  query('signatureType').optional().isIn(['CUSTOMER', 'DRIVER', 'WITNESS']).withMessage('Invalid signature type'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      page = 1,
      limit = 20,
      orderId,
      userId,
      signatureType,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (userId) where.userId = userId;
    if (signatureType) where.signatureType = signatureType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get signatures with pagination
    const [signatures, total] = await Promise.all([
      prisma.signature.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              pickupAddress: true,
              deliveryAddress: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.signature.count({ where })
    ]);

    res.json({
      success: true,
      data: signatures,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/signatures/:id
// @desc    Get signature by ID
// @access  Private
router.get('/:id', authenticateToken, [
  param('id').isString().withMessage('Signature ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;

    const signature = await prisma.signature.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            pickupAddress: true,
            deliveryAddress: true,
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!signature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    res.json({
      success: true,
      data: signature
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/signatures
// @desc    Create new signature
// @access  Private
router.post('/', authenticateToken, validateSignature, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      orderId,
      signatureData,
      signatureType = 'CUSTOMER',
      ipAddress,
      userAgent,
      location
    } = req.body;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions based on signature type
    if (signatureType === 'CUSTOMER') {
      // Only the customer who placed the order can sign
      if (order.customerId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the customer who placed the order can sign.'
        });
      }
    } else if (signatureType === 'DRIVER') {
      // Only assigned driver or admin can sign
      if (order.driverId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the assigned driver can sign.'
        });
      }
    }

    // Check if signature already exists for this order and type
    const existingSignature = await prisma.signature.findFirst({
      where: {
        orderId,
        signatureType,
        userId: req.user.id
      }
    });

    if (existingSignature) {
      return res.status(400).json({
        success: false,
        message: 'Signature already exists for this order and type'
      });
    }

    // Create signature
    const signature = await prisma.signature.create({
      data: {
        orderId,
        userId: req.user.id,
        signatureData,
        signatureType,
        ipAddress: ipAddress || req.ip,
        userAgent: userAgent || req.get('User-Agent'),
        location
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Signature captured successfully',
      data: signature
    });
  } catch (error) {
    console.error('Error creating signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/signatures/:id
// @desc    Update signature
// @access  Private
router.put('/:id', authenticateToken, [
  param('id').isString().withMessage('Signature ID must be a string'),
  body('signatureData').optional().notEmpty().withMessage('Signature data cannot be empty'),
  body('location').optional().isString().withMessage('Location must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if signature exists
    const existingSignature = await prisma.signature.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!existingSignature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Check permissions (only the user who created the signature or admin can update)
    if (req.user.role !== 'ADMIN' && existingSignature.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update signature
    const updatedSignature = await prisma.signature.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Signature updated successfully',
      data: updatedSignature
    });
  } catch (error) {
    console.error('Error updating signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/signatures/:id
// @desc    Delete signature
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, [
  param('id').isString().withMessage('Signature ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if user is admin
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params;

    // Check if signature exists
    const existingSignature = await prisma.signature.findUnique({
      where: { id }
    });

    if (!existingSignature) {
      return res.status(404).json({
        success: false,
        message: 'Signature not found'
      });
    }

    // Delete signature
    await prisma.signature.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Signature deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting signature:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/signatures/order/:orderId
// @desc    Get all signatures for a specific order
// @access  Private
router.get('/order/:orderId', authenticateToken, [
  param('orderId').isString().withMessage('Order ID must be a string')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { orderId } = req.params;

    // Check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions (only customer, assigned driver, or admin can view)
    if (req.user.role !== 'ADMIN' && 
        order.customerId !== req.user.id && 
        order.driverId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get signatures for the order
    const signatures = await prisma.signature.findMany({
      where: { orderId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      success: true,
      data: signatures
    });
  } catch (error) {
    console.error('Error fetching order signatures:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
