import express, { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateOrder = [
  body('pickupAddress').notEmpty().withMessage('Pickup address is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').notEmpty().withMessage('Item name is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be positive'),
  body('scheduledPickup').optional().isISO8601().withMessage('Invalid pickup date format'),
  body('scheduledDelivery').optional().isISO8601().withMessage('Invalid delivery date format'),
  body('instructions').optional().isString().withMessage('Instructions must be a string'),
  body('isFragile').optional().isBoolean().withMessage('isFragile must be a boolean'),
  body('requiresSignature').optional().isBoolean().withMessage('requiresSignature must be a boolean'),
  body('requiresPhoto').optional().isBoolean().withMessage('requiresPhoto must be a boolean')
];

const validateOrderUpdate = [
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']),
  body('driverId').optional().isString().withMessage('Driver ID must be a string'),
  body('scheduledPickup').optional().isISO8601().withMessage('Invalid pickup date format'),
  body('scheduledDelivery').optional().isISO8601().withMessage('Invalid delivery date format'),
  body('actualPickup').optional().isISO8601().withMessage('Invalid pickup date format'),
  body('actualDelivery').optional().isISO8601().withMessage('Invalid delivery date format')
];

// @route   GET /api/orders
// @desc    Get all orders with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']),
  query('customerId').optional().isString().withMessage('Customer ID must be a string'),
  query('driverId').optional().isString().withMessage('Driver ID must be a string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid delivery date format'),
  query('search').optional().isString().withMessage('Search must be a string')
], async (req: Request, res: Response) => {
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
      status,
      customerId,
      driverId,
      startDate,
      endDate,
      search
    } = req.query as any;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause - only include non-empty values
    const where: any = {};
    
    if (status && status !== '') where.status = status;
    if (customerId && customerId !== '') where.customerId = customerId;
    if (driverId && driverId !== '') where.driverId = driverId;
    
    if (startDate && startDate !== '') {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
    }
    if (endDate && endDate !== '') {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    }

    // Add search functionality if search parameter is provided
    if (search && search !== '') {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { pickupAddress: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
        { customer: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } }
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          items: true,
          deliveries: {
            include: {
              driver: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.order.count({ where })
    ]);

    return res.json({
      success: true,
      data: orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', authenticateToken, [
  param('id').isString().withMessage('Order ID must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params as any;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true
          }
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            driverProfile: true
          }
        },
        items: true,
        deliveries: {
          include: {
            driver: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        signatures: true,
        photos: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post('/', authenticateToken, validateOrder, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const {
      pickupAddress,
      deliveryAddress,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      items,
      scheduledPickup,
      scheduledDelivery,
      instructions,
      isFragile,
      requiresSignature,
      requiresPhoto
    } = req.body as any;

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = 5.0; // Fixed delivery fee
    const total = subtotal + tax + deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with items
    const order = await prisma.order.create({
      data: {
        orderNumber,
        customerId: (req as any).user.id,
        pickupAddress,
        deliveryAddress,
        pickupLat,
        pickupLng,
        deliveryLat,
        deliveryLng,
        scheduledPickup: scheduledPickup ? new Date(scheduledPickup) : null,
        scheduledDelivery: scheduledDelivery ? new Date(scheduledDelivery) : null,
        instructions,
        isFragile: isFragile || false,
        requiresSignature: requiresSignature !== false, // Default to true
        requiresPhoto: requiresPhoto !== false, // Default to true
        subtotal,
        tax,
        deliveryFee,
        total,
        items: {
          create: items.map((item: any) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
            weight: item.weight,
            dimensions: item.dimensions
          }))
        }
      },
      include: {
        items: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order
// @access  Private
router.put('/:id', authenticateToken, [
  param('id').isString().withMessage('Order ID must be a string'),
  ...validateOrderUpdate
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params as any;
    const updateData = req.body as any;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions (only customer who created the order or admin can update)
    if ((req as any).user.role !== 'ADMIN' && existingOrder.customerId !== (req as any).user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
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

    return res.json({
      success: true,
      message: 'Order updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Delete order
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, [
  param('id').isString().withMessage('Order ID must be a string')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if user is admin
    if ((req as any).user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params as any;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be deleted (not in progress)
    if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(existingOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete order that is in progress'
      });
    }

    // Delete order (cascade will handle related records)
    await prisma.order.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
