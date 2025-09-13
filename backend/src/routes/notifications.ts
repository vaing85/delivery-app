import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateNotification = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM']).withMessage('Invalid notification type'),
  body('data').optional().isObject().withMessage('Data must be an object')
];

// @route   GET /api/notifications
// @desc    Get all notifications for the authenticated user
// @access  Private
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('type').optional().isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM']).withMessage('Invalid notification type'),
  query('isRead').optional().isBoolean().withMessage('isRead must be a boolean'),
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
      type,
      isRead,
      startDate,
      endDate
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      userId: req.user.id
    };
    
    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === 'true';
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.notification.count({ where })
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get count of unread notifications for the authenticated user
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: (req as any).user?.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount: count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/:id
// @desc    Get notification by ID
// @access  Private
router.get('/:id', authenticateToken, [
  param('id').isString().withMessage('Notification ID must be a string')
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

    const notification = await prisma.notification.findFirst({
      where: { 
        id,
        userId: req.user.id
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create new notification (Admin/System only)
// @access  Private (Admin/System only)
router.post('/', authenticateToken, validateNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if user has permission to create notifications
    if (!['ADMIN', 'SYSTEM'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or System privileges required.'
      });
    }

    const {
      userId,
      title,
      message,
      type,
      data
    } = req.body;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found'
      });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data || {}
      }
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/notifications/:id
// @desc    Update notification (mark as read)
// @access  Private
router.put('/:id', authenticateToken, [
  param('id').isString().withMessage('Notification ID must be a string'),
  body('isRead').isBoolean().withMessage('isRead must be a boolean')
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
    const { isRead } = req.body;

    // Check if notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: { 
        id,
        userId: req.user.id
      }
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Update notification
    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { isRead }
    });

    res.json({
      success: true,
      message: 'Notification updated successfully',
      data: updatedNotification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications as read for the authenticated user
// @access  Private
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: (req as any).user?.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      data: { updatedCount: result.count }
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticateToken, [
  param('id').isString().withMessage('Notification ID must be a string')
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

    // Check if notification exists and belongs to the user
    const existingNotification = await prisma.notification.findFirst({
      where: { 
        id,
        userId: (req as any).user?.id
      }
    });

    if (!existingNotification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Clear all notifications for the authenticated user
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
  try {
    // Delete all notifications for the user
    const result = await prisma.notification.deleteMany({
      where: {
        userId: (req as any).user?.id
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications cleared`,
      data: { deletedCount: result.count }
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/notifications/bulk
// @desc    Create multiple notifications (Admin/System only)
// @access  Private (Admin/System only)
router.post('/bulk', authenticateToken, [
  body('notifications').isArray({ min: 1 }).withMessage('Notifications array is required'),
  body('notifications.*.userId').notEmpty().withMessage('User ID is required for each notification'),
  body('notifications.*.title').notEmpty().withMessage('Title is required for each notification'),
  body('notifications.*.message').notEmpty().withMessage('Message is required for each notification'),
  body('notifications.*.type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM']).withMessage('Invalid notification type for each notification')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    // Check if user has permission to create bulk notifications
    if (!['ADMIN', 'SYSTEM'].includes((req as any).user?.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or System privileges required.'
      });
    }

    const { notifications } = req.body;

    // Validate that all target users exist
    const userIds = notifications.map((n: any) => n.userId);
    const existingUsers = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true }
    });

    const existingUserIds = existingUsers.map(u => u.id);
    const invalidUserIds = userIds.filter((id: string) => !existingUserIds.includes(id));

    if (invalidUserIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid user IDs: ${invalidUserIds.join(', ')}`
      });
    }

    // Create notifications
    const createdNotifications = await prisma.notification.createMany({
      data: notifications.map((n: any) => ({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        data: n.data || {}
      }))
    });

    res.status(201).json({
      success: true,
      message: `${createdNotifications.count} notifications created successfully`,
      data: { createdCount: createdNotifications.count }
    });
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
