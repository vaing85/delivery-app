import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';

const prisma = new PrismaClient();

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'DELIVERY_STATUS' | 'PAYMENT' | 'SYSTEM' | 'DRIVER_ASSIGNED' | 'LOCATION_UPDATE';
  data?: any;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class NotificationService {
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  // Create and send notification
  async sendNotification(notificationData: NotificationData) {
    try {
      // Save to database
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: notificationData.data || {}
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      // Send real-time notification via WebSocket
      this.io.to(`user:${notificationData.userId}`).emit('notification:new', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        data: notification.data,
        timestamp: notification.createdAt
      });

      // Send push notification (if user has device tokens)
      await this.sendPushNotification(notificationData);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Send notification to multiple users
  async sendBulkNotification(userIds: string[], notificationData: Omit<NotificationData, 'userId'>) {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => 
          this.sendNotification({
            ...notificationData,
            userId
          })
        )
      );

      return notifications;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      throw error;
    }
  }

  // Send notification to users by role
  async sendRoleNotification(role: string, notificationData: Omit<NotificationData, 'userId'>) {
    try {
      const users = await prisma.user.findMany({
        where: { role: role as any },
        select: { id: true }
      });

      const userIds = users.map(user => user.id);
      return await this.sendBulkNotification(userIds, notificationData);
    } catch (error) {
      console.error('Error sending role notification:', error);
      throw error;
    }
  }

  // Send push notification (mock implementation - would integrate with FCM, APNS, etc.)
  private async sendPushNotification(notificationData: NotificationData) {
    try {
      // In a real implementation, this would:
      // 1. Get user's device tokens from database
      // 2. Send to Firebase Cloud Messaging (Android) or Apple Push Notification Service (iOS)
      // 3. Handle delivery receipts and cleanup invalid tokens

      console.log(`Push notification sent to user ${notificationData.userId}:`, {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type
      });

      // Mock implementation - would be replaced with actual push service
      return { success: true, messageId: `mock_${Date.now()}` };
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Don't throw error for push notifications as they're not critical
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId
        },
        data: {
          isRead: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Delete old notifications (cleanup)
  async deleteOldNotifications(daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          },
          isRead: true
        }
      });

      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  // Driver-specific notification methods
  async notifyDriverAssigned(driverId: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!order) return;

    return await this.sendNotification({
      userId: driverId,
      title: 'New Delivery Assignment',
      message: `You have been assigned to deliver order #${order.orderNumber} for ${order.customer.firstName} ${order.customer.lastName}`,
      type: 'DRIVER_ASSIGNED',
      data: { orderId, orderNumber: order.orderNumber },
      priority: 'HIGH'
    });
  }

  async notifyOrderStatusUpdate(customerId: string, orderId: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { orderNumber: true }
    });

    if (!order) return;

    const statusMessages = {
      'CONFIRMED': 'Your order has been confirmed and is being prepared',
      'ASSIGNED': 'A driver has been assigned to your order',
      'PICKED_UP': 'Your order has been picked up and is on its way',
      'IN_TRANSIT': 'Your order is currently in transit',
      'OUT_FOR_DELIVERY': 'Your order is out for delivery',
      'DELIVERED': 'Your order has been delivered successfully',
      'FAILED': 'There was an issue with your delivery',
      'CANCELLED': 'Your order has been cancelled'
    };

    return await this.sendNotification({
      userId: customerId,
      title: 'Order Status Update',
      message: `Order #${order.orderNumber}: ${statusMessages[status as keyof typeof statusMessages] || 'Status updated'}`,
      type: 'ORDER_UPDATE',
      data: { orderId, status },
      priority: 'MEDIUM'
    });
  }

  async notifyLocationUpdate(customerId: string, driverId: string, location: { latitude: number; longitude: number }) {
    return await this.sendNotification({
      userId: customerId,
      title: 'Driver Location Update',
      message: 'Your driver\'s location has been updated',
      type: 'LOCATION_UPDATE',
      data: { driverId, location },
      priority: 'LOW'
    });
  }
}

// Export singleton instance
let notificationService: NotificationService;

export const getNotificationService = (io: SocketIOServer) => {
  if (!notificationService) {
    notificationService = new NotificationService(io);
  }
  return notificationService;
};
