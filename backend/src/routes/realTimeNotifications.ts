import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';
import { getRealTimeNotificationService } from '../services/realTimeNotificationService';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Validation middleware
const validateRealTimeNotification = [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM', 'DRIVER_ALERT', 'CUSTOMER_ALERT', 'ADMIN_ALERT']).withMessage('Invalid notification type'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level'),
  body('userId').optional().isUUID().withMessage('Invalid user ID'),
  body('data').optional().isObject().withMessage('Data must be an object'),
  body('expiresAt').optional().isISO8601().withMessage('Invalid expiration date'),
  body('actionRequired').optional().isBoolean().withMessage('Action required must be boolean'),
  body('actionUrl').optional().isURL().withMessage('Invalid action URL'),
  body('actionText').optional().isString().withMessage('Action text must be string')
];

const validateTemplateNotification = [
  body('templateId').notEmpty().withMessage('Template ID is required'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('variables').isObject().withMessage('Variables must be an object')
];

const validateBulkNotification = [
  body('userIds').isArray({ min: 1 }).withMessage('User IDs must be a non-empty array'),
  body('userIds.*').isUUID().withMessage('Invalid user ID'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM', 'DRIVER_ALERT', 'CUSTOMER_ALERT', 'ADMIN_ALERT']).withMessage('Invalid notification type'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level')
];

const validateRoleBasedNotification = [
  body('roles').isArray({ min: 1 }).withMessage('Roles must be a non-empty array'),
  body('roles.*').isIn(['ADMIN', 'CUSTOMER', 'DRIVER', 'BUSINESS']).withMessage('Invalid role'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM', 'DRIVER_ALERT', 'CUSTOMER_ALERT', 'ADMIN_ALERT']).withMessage('Invalid notification type'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level')
];

// @route   POST /api/real-time-notifications/send
// @desc    Send real-time notification to specific user
// @access  Private (Admin/System only)
router.post('/send', authenticateToken, requireAdmin, validateRealTimeNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const notificationData = {
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      priority: req.body.priority,
      data: req.body.data,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      actionRequired: req.body.actionRequired,
      actionUrl: req.body.actionUrl,
      actionText: req.body.actionText
    };

    const notification = await realTimeNotificationService.sendRealTimeNotification(notificationData);

    res.status(201).json({
      success: true,
      message: 'Real-time notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error sending real-time notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/real-time-notifications/template
// @desc    Send notification using template
// @access  Private (Admin/System only)
router.post('/template', authenticateToken, requireAdmin, validateTemplateNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const { templateId, userId, variables } = req.body;

    const notification = await realTimeNotificationService.sendTemplateNotification(templateId, userId, variables);

    res.status(201).json({
      success: true,
      message: 'Template notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Error sending template notification:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// @route   POST /api/real-time-notifications/bulk
// @desc    Send bulk real-time notifications
// @access  Private (Admin/System only)
router.post('/bulk', authenticateToken, requireAdmin, validateBulkNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const { userIds, ...notificationData } = req.body;

    const results = await realTimeNotificationService.sendBulkRealTimeNotification(userIds, notificationData);

    res.status(201).json({
      success: true,
      message: 'Bulk notifications sent successfully',
      data: results
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/real-time-notifications/role-based
// @desc    Send notification to role-based groups
// @access  Private (Admin/System only)
router.post('/role-based', authenticateToken, requireAdmin, validateRoleBasedNotification, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const { roles, ...notificationData } = req.body;

    const results = await realTimeNotificationService.sendRoleBasedNotification(roles, notificationData);

    res.status(201).json({
      success: true,
      message: 'Role-based notifications sent successfully',
      data: results
    });
  } catch (error) {
    console.error('Error sending role-based notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/real-time-notifications/system
// @desc    Send system-wide notification
// @access  Private (Admin only)
router.post('/system', authenticateToken, requireAdmin, [
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').isIn(['ORDER_UPDATE', 'DELIVERY_STATUS', 'PAYMENT', 'SYSTEM', 'DRIVER_ALERT', 'CUSTOMER_ALERT', 'ADMIN_ALERT']).withMessage('Invalid notification type'),
  body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const notificationData = {
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      priority: req.body.priority,
      data: req.body.data,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      actionRequired: req.body.actionRequired,
      actionUrl: req.body.actionUrl,
      actionText: req.body.actionText
    };

    const results = await realTimeNotificationService.sendSystemNotification(notificationData);

    res.status(201).json({
      success: true,
      message: 'System notification sent successfully',
      data: results
    });
  } catch (error) {
    console.error('Error sending system notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/real-time-notifications/schedule
// @desc    Schedule notification for future delivery
// @access  Private (Admin/System only)
router.post('/schedule', authenticateToken, requireAdmin, [
  ...validateRealTimeNotification,
  body('scheduledFor').isISO8601().withMessage('Scheduled date is required and must be valid ISO8601 date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const notificationData = {
      userId: req.body.userId,
      title: req.body.title,
      message: req.body.message,
      type: req.body.type,
      priority: req.body.priority,
      data: req.body.data,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : undefined,
      actionRequired: req.body.actionRequired,
      actionUrl: req.body.actionUrl,
      actionText: req.body.actionText
    };

    const scheduledFor = new Date(req.body.scheduledFor);

    const scheduledNotification = await realTimeNotificationService.scheduleNotification(notificationData, scheduledFor);

    res.status(201).json({
      success: true,
      message: 'Notification scheduled successfully',
      data: scheduledNotification
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/real-time-notifications/templates
// @desc    Get notification templates
// @access  Private (Admin only)
router.get('/templates', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const templates = realTimeNotificationService.getNotificationTemplates();

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error getting notification templates:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/real-time-notifications/online-users
// @desc    Get online users statistics
// @access  Private (Admin only)
router.get('/online-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const realTimeNotificationService = getRealTimeNotificationService(req.app.locals.io, req.app.locals.notificationService);
    
    if (!realTimeNotificationService) {
      return res.status(500).json({
        success: false,
        message: 'Real-time notification service not available'
      });
    }

    const totalOnline = realTimeNotificationService.getOnlineUsersCount();
    const onlineAdmins = await realTimeNotificationService.getOnlineUsersByRole('ADMIN');
    const onlineDrivers = await realTimeNotificationService.getOnlineUsersByRole('DRIVER');
    const onlineCustomers = await realTimeNotificationService.getOnlineUsersByRole('CUSTOMER');
    const onlineBusinesses = await realTimeNotificationService.getOnlineUsersByRole('BUSINESS');

    res.json({
      success: true,
      data: {
        total: totalOnline,
        byRole: {
          admin: onlineAdmins,
          driver: onlineDrivers,
          customer: onlineCustomers,
          business: onlineBusinesses
        }
      }
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/real-time-notifications/scheduled
// @desc    Get scheduled notifications
// @access  Private (Admin only)
router.get('/scheduled', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, isSent } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (isSent !== undefined) {
      where.isSent = isSent === 'true';
    }

    const [scheduledNotifications, total] = await Promise.all([
      prisma.scheduledNotification.findMany({
        where,
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
        orderBy: { scheduledFor: 'asc' },
        skip,
        take: Number(limit)
      }),
      prisma.scheduledNotification.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        notifications: scheduledNotifications,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/real-time-notifications/scheduled/:id
// @desc    Cancel scheduled notification
// @access  Private (Admin only)
router.delete('/scheduled/:id', authenticateToken, requireAdmin, [
  param('id').isUUID().withMessage('Invalid notification ID')
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

    const scheduledNotification = await prisma.scheduledNotification.findUnique({
      where: { id }
    });

    if (!scheduledNotification) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled notification not found'
      });
    }

    if (scheduledNotification.isSent) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel already sent notification'
      });
    }

    await prisma.scheduledNotification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Scheduled notification cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling scheduled notification:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
