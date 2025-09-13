import express, { Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateDelivery = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('driverId').notEmpty().withMessage('Driver ID is required'),
  body('estimatedDuration').optional().isInt({ min: 1 }).withMessage('Estimated duration must be positive'),
  body('distance').optional().isFloat({ min: 0 }).withMessage('Distance must be positive')
];

const validateDeliveryUpdate = [
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']),
  body('startTime').optional().isISO8601().withMessage('Invalid start time format'),
  body('endTime').optional().isISO8601().withMessage('Invalid end time format'),
  body('actualDuration').optional().isInt({ min: 0 }).withMessage('Actual duration must be non-negative'),
  body('route').optional().isObject().withMessage('Route must be an object'),
  body('distance').optional().isFloat({ min: 0 }).withMessage('Distance must be positive')
];

// @route   GET /api/deliveries
// @desc    Get all deliveries with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED']),
  query('driverId').optional().isString().withMessage('Driver ID must be a string'),
  query('orderId').optional().isString().withMessage('Order ID must be a string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
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
      driverId,
      orderId,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause - only include non-empty values
    const where: any = {};
    if (status && status !== '') where.status = status;
    if (driverId && driverId !== '') where.driverId = driverId;
    if (orderId && orderId !== '') where.orderId = orderId;
    
    if (startDate && startDate !== '') {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
    }
    if (endDate && endDate !== '') {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    }

    // Get deliveries with pagination
    const [deliveries, total] = await Promise.all([
      prisma.delivery.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              pickupAddress: true,
              deliveryAddress: true,
              scheduledPickup: true,
              scheduledDelivery: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              driverProfile: {
                select: {
                  vehicleType: true,
                  vehicleModel: true,
                  licensePlate: true,
                  currentLocationLat: true,
                  currentLocationLng: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.delivery.count({ where })
    ]);

    res.json({
      success: true,
      data: deliveries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/deliveries/:id
// @desc    Get delivery by ID
// @access  Private
router.get('/:id', authenticateToken, [
  param('id').isString().withMessage('Delivery ID must be a string')
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

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            pickupAddress: true,
            deliveryAddress: true,
            scheduledPickup: true,
            scheduledDelivery: true,
            actualPickup: true,
            actualDelivery: true,
            instructions: true,
            isFragile: true,
            requiresSignature: true,
            requiresPhoto: true,
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
            items: true,
            signatures: true,
            photos: true
          }
        },
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            driverProfile: {
              select: {
                vehicleType: true,
                vehicleModel: true,
                licensePlate: true,
                currentLocationLat: true,
                currentLocationLng: true,
                rating: true,
                totalDeliveries: true
              }
            }
          }
        }
      }
    });

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/deliveries
// @desc    Create new delivery (assign driver to order)
// @access  Private
router.post('/', authenticateToken, validateDelivery, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { orderId, driverId, estimatedDuration, distance } = req.body as any;

    // Check if order exists and is available for delivery
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

    if (order.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Order must be confirmed before assigning delivery'
      });
    }

    // Check if driver exists and is available
    const driver = await prisma.user.findUnique({
      where: { id: driverId },
      include: { driverProfile: true }
    });

    if (!driver || driver.role !== 'DRIVER') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.driverProfile?.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not available'
      });
    }

    // Check if delivery already exists for this order
    const existingDelivery = await prisma.delivery.findFirst({
      where: { orderId }
    });

    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message: 'Delivery already exists for this order'
      });
    }

    // Create delivery and update order status
    const [delivery] = await prisma.$transaction([
      prisma.delivery.create({
        data: {
          orderId,
          driverId,
          estimatedDuration,
          distance,
          status: 'ASSIGNED'
        },
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
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }),
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'ASSIGNED' }
      }),
      prisma.driverProfile.update({
        where: { userId: driverId },
        data: { isAvailable: false }
      })
    ]);

    return res.status(201).json({
      success: true,
      message: 'Driver assigned successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/deliveries/:id
// @desc    Update delivery
// @access  Private
router.put('/:id', authenticateToken, [
  param('id').isString().withMessage('Delivery ID must be a string'),
  ...validateDeliveryUpdate
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

    // Check if delivery exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!existingDelivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check permissions (only driver assigned to delivery, admin, or dispatcher can update)
    if ((req as any).user?.role !== 'ADMIN' &&
        (req as any).user?.role !== 'DISPATCHER' &&
        existingDelivery.driverId !== (req as any).user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update delivery
    const updatedDelivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
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
        driver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: updatedDelivery
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/deliveries/:id
// @desc    Delete delivery
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, [
  param('id').isString().withMessage('Delivery ID must be a string')
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
    if ((req as any).user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { id } = req.params as any;

    // Check if delivery exists
    const existingDelivery = await prisma.delivery.findUnique({
      where: { id }
    });

    if (!existingDelivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Check if delivery can be deleted (not in progress)
    if (['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(existingDelivery.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete delivery that is in progress'
      });
    }

    // Delete delivery
    await prisma.delivery.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Delivery deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
