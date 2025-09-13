import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { getCloudStorageService, createUploadMiddleware } from '../services/cloudStorageService';
import { getNotificationService } from '../services/notificationService';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validatePhoto = [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('photoUrl').notEmpty().withMessage('Photo URL is required'),
  body('photoType').isIn(['PICKUP', 'DELIVERY', 'DAMAGE', 'ISSUE']).withMessage('Invalid photo type'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
];

// @route   GET /api/photos
// @desc    Get all photos with filtering and pagination
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('orderId').optional().isString().withMessage('Order ID must be a string'),
  query('userId').optional().isString().withMessage('User ID must be a string'),
  query('photoType').optional().isIn(['PICKUP', 'DELIVERY', 'DAMAGE', 'ISSUE']).withMessage('Invalid photo type'),
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
      photoType,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (userId) where.userId = userId;
    if (photoType) where.photoType = photoType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get photos with pagination
    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
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
      prisma.photo.count({ where })
    ]);

    res.json({
      success: true,
      data: photos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/photos/:id
// @desc    Get photo by ID
// @access  Private
router.get('/:id', authenticateToken, [
  param('id').isString().withMessage('Photo ID must be a string')
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

    const photo = await prisma.photo.findUnique({
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

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    res.json({
      success: true,
      data: photo
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/photos
// @desc    Create new photo
// @access  Private
router.post('/', authenticateToken, validatePhoto, async (req, res) => {
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
      photoUrl,
      photoType,
      description,
      metadata
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

    // Check permissions based on photo type
    if (photoType === 'PICKUP' || photoType === 'DELIVERY') {
      // Only assigned driver or admin can upload pickup/delivery photos
      if (order.driverId !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the assigned driver can upload pickup/delivery photos.'
        });
      }
    } else if (photoType === 'DAMAGE' || photoType === 'ISSUE') {
      // Customer, driver, or admin can upload damage/issue photos
      if (order.customerId !== req.user.id && 
          order.driverId !== req.user.id && 
          req.user.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the customer, assigned driver, or admin can upload damage/issue photos.'
        });
      }
    }

    // Create photo
    const photo = await prisma.photo.create({
      data: {
        orderId,
        userId: req.user.id,
        photoUrl,
        photoType,
        description,
        metadata: metadata || {}
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
      message: 'Photo uploaded successfully',
      data: photo
    });
  } catch (error) {
    console.error('Error creating photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/photos/:id
// @desc    Update photo
// @access  Private
router.put('/:id', authenticateToken, [
  param('id').isString().withMessage('Photo ID must be a string'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object')
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

    // Check if photo exists
    const existingPhoto = await prisma.photo.findUnique({
      where: { id },
      include: { order: true }
    });

    if (!existingPhoto) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Check permissions (only the user who uploaded the photo or admin can update)
    if (req.user.role !== 'ADMIN' && existingPhoto.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update photo
    const updatedPhoto = await prisma.photo.update({
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
      message: 'Photo updated successfully',
      data: updatedPhoto
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/photos/:id
// @desc    Delete photo
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, [
  param('id').isString().withMessage('Photo ID must be a string')
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

    // Check if photo exists
    const existingPhoto = await prisma.photo.findUnique({
      where: { id }
    });

    if (!existingPhoto) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found'
      });
    }

    // Delete photo
    await prisma.photo.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/photos/order/:orderId
// @desc    Get all photos for a specific order
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

    // Get photos for the order
    const photos = await prisma.photo.findMany({
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
      data: photos
    });
  } catch (error) {
    console.error('Error fetching order photos:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/photos/order/:orderId/type/:photoType
// @desc    Get photos of a specific type for an order
// @access  Private
router.get('/order/:orderId/type/:photoType', authenticateToken, [
  param('orderId').isString().withMessage('Order ID must be a string'),
  param('photoType').isIn(['PICKUP', 'DELIVERY', 'DAMAGE', 'ISSUE']).withMessage('Invalid photo type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { orderId, photoType } = req.params;

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

    // Get photos of specific type for the order
    const photos = await prisma.photo.findMany({
      where: { 
        orderId,
        photoType
      },
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
      data: photos
    });
  } catch (error) {
    console.error('Error fetching order photos by type:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/photos/upload
// @desc    Upload photo with cloud storage
// @access  Private
const uploadMiddleware = createUploadMiddleware({
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
});

router.post('/upload', authenticateToken, uploadMiddleware.single('photo'), async (req, res) => {
  try {
    const { orderId, photoType, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No photo uploaded' }
      });
    }

    if (!orderId || !photoType) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID and photo type are required' }
      });
    }

    // Upload to cloud storage
    const cloudStorage = getCloudStorageService();
    const uploadResult = await cloudStorage.uploadFile(req.file, {
      folder: 'delivery-photos',
      resize: {
        width: 1920,
        height: 1080,
        quality: 85
      },
      generateThumbnail: true,
      thumbnailSize: {
        width: 300,
        height: 300
      }
    });

    // Save photo metadata to database
    const photo = await prisma.photo.create({
      data: {
        orderId,
        userId,
        photoUrl: uploadResult.url,
        photoType: photoType as 'PICKUP' | 'DELIVERY' | 'DAMAGE' | 'ISSUE',
        description,
        metadata: JSON.stringify({
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: req.file.mimetype,
          thumbnailUrl: uploadResult.thumbnailUrl,
          uploadedAt: new Date().toISOString()
        })
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            customerId: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Send notification to customer
    const notificationService = getNotificationService(req.app.locals.io);
    await notificationService.sendNotification({
      userId: photo.order.customerId,
      title: 'Delivery Photo Received',
      message: `A ${photoType.toLowerCase()} photo has been uploaded for order #${photo.order.orderNumber}`,
      type: 'DELIVERY_STATUS',
      data: JSON.stringify({ orderId, photoId: photo.id, photoType })
    });

    res.json({
      success: true,
      data: {
        photo: {
          ...photo,
          thumbnailUrl: uploadResult.thumbnailUrl
        }
      }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload photo' }
    });
  }
});

// @route   DELETE /api/photos/:id
// @desc    Delete photo and remove from cloud storage
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Get photo from database
    const photo = await prisma.photo.findUnique({
      where: { id },
      include: {
        user: {
          select: { role: true }
        }
      }
    });

    if (!photo) {
      return res.status(404).json({
        success: false,
        error: { message: 'Photo not found' }
      });
    }

    // Check permissions
    if (photo.userId !== userId && photo.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    // Delete from cloud storage
    const cloudStorage = getCloudStorageService();
    const key = photo.photoUrl.replace(/^.*\/uploads\//, '');
    const thumbnailKey = (photo.metadata as any)?.thumbnailUrl ? 
      (photo.metadata as any).thumbnailUrl.replace(/^.*\/uploads\//, '') : undefined;

    await cloudStorage.deleteFile(key, thumbnailKey);

    // Delete from database
    await prisma.photo.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete photo' }
    });
  }
});

export default router;
