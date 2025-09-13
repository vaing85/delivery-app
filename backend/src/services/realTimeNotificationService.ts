import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notificationService';

const prisma = new PrismaClient();

export interface RealTimeNotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'ORDER_UPDATE' | 'DELIVERY_STATUS' | 'PAYMENT' | 'SYSTEM' | 'DRIVER_ALERT' | 'CUSTOMER_ALERT' | 'ADMIN_ALERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  data?: any;
  expiresAt?: Date;
  actionRequired?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  variables: string[];
  isActive: boolean;
}

export class RealTimeNotificationService {
  private io: SocketIOServer;
  private notificationService: NotificationService;
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private notificationTemplates: Map<string, NotificationTemplate> = new Map();

  constructor(io: SocketIOServer, notificationService: NotificationService) {
    this.io = io;
    this.notificationService = notificationService;
    this.initializeTemplates();
  }

  // Initialize notification templates
  private initializeTemplates() {
    const templates: NotificationTemplate[] = [
      {
        id: 'order_created',
        name: 'Order Created',
        title: 'New Order #{orderNumber}',
        message: 'A new order has been created for {customerName}',
        type: 'ORDER_UPDATE',
        priority: 'MEDIUM',
        variables: ['orderNumber', 'customerName'],
        isActive: true
      },
      {
        id: 'order_assigned',
        name: 'Order Assigned',
        title: 'Order #{orderNumber} Assigned',
        message: 'Order has been assigned to driver {driverName}',
        type: 'ORDER_UPDATE',
        priority: 'HIGH',
        variables: ['orderNumber', 'driverName'],
        isActive: true
      },
      {
        id: 'delivery_started',
        name: 'Delivery Started',
        title: 'Delivery #{deliveryNumber} Started',
        message: 'Driver {driverName} has started delivery to {customerName}',
        type: 'DELIVERY_STATUS',
        priority: 'HIGH',
        variables: ['deliveryNumber', 'driverName', 'customerName'],
        isActive: true
      },
      {
        id: 'delivery_completed',
        name: 'Delivery Completed',
        title: 'Delivery #{deliveryNumber} Completed',
        message: 'Delivery has been completed successfully',
        type: 'DELIVERY_STATUS',
        priority: 'MEDIUM',
        variables: ['deliveryNumber'],
        isActive: true
      },
      {
        id: 'payment_received',
        name: 'Payment Received',
        title: 'Payment Received',
        message: 'Payment of ${amount} has been received for order #{orderNumber}',
        type: 'PAYMENT',
        priority: 'HIGH',
        variables: ['amount', 'orderNumber'],
        isActive: true
      },
      {
        id: 'driver_offline',
        name: 'Driver Offline',
        title: 'Driver {driverName} is Offline',
        message: 'Driver {driverName} has gone offline',
        type: 'DRIVER_ALERT',
        priority: 'MEDIUM',
        variables: ['driverName'],
        isActive: true
      },
      {
        id: 'system_maintenance',
        name: 'System Maintenance',
        title: 'Scheduled Maintenance',
        message: 'System will be under maintenance from {startTime} to {endTime}',
        type: 'SYSTEM',
        priority: 'HIGH',
        variables: ['startTime', 'endTime'],
        isActive: true
      }
    ];

    templates.forEach(template => {
      this.notificationTemplates.set(template.id, template);
    });
  }

  // Send real-time notification with enhanced features
  async sendRealTimeNotification(notificationData: RealTimeNotificationData) {
    try {
      // Save to database
      const notification = await prisma.notification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: JSON.stringify({
            ...notificationData.data,
            priority: notificationData.priority,
            expiresAt: notificationData.expiresAt,
            actionRequired: notificationData.actionRequired,
            actionUrl: notificationData.actionUrl,
            actionText: notificationData.actionText
          })
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              role: true,
              email: true
            }
          }
        }
      });

      // Send real-time notification via WebSocket
      const realTimeData = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notificationData.priority,
        data: notificationData.data,
        timestamp: notification.createdAt,
        expiresAt: notificationData.expiresAt,
        actionRequired: notificationData.actionRequired,
        actionUrl: notificationData.actionUrl,
        actionText: notificationData.actionText,
        user: notification.user
      };

      // Send to specific user
      this.io.to(`user:${notificationData.userId}`).emit('notification:real-time', realTimeData);

      // Send to role-based rooms if needed
      if (notificationData.type === 'ADMIN_ALERT') {
        this.io.to('admins').emit('notification:admin-alert', realTimeData);
      }

      if (notificationData.type === 'DRIVER_ALERT') {
        this.io.to('drivers').emit('notification:driver-alert', realTimeData);
      }

      // Send push notification
      await this.sendPushNotification(notificationData);

      return notification;
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      throw error;
    }
  }

  // Send notification using template
  async sendTemplateNotification(templateId: string, userId: string, variables: Record<string, any>) {
    const template = this.notificationTemplates.get(templateId);
    if (!template || !template.isActive) {
      throw new Error(`Template ${templateId} not found or inactive`);
    }

    // Replace variables in template
    let title = template.title;
    let message = template.message;

    template.variables.forEach(variable => {
      const value = variables[variable] || `{${variable}}`;
      title = title.replace(`{${variable}}`, value);
      message = message.replace(`{${variable}}`, value);
    });

    const notificationData: RealTimeNotificationData = {
      userId,
      title,
      message,
      type: template.type as any,
      priority: template.priority as any,
      data: variables
    };

    return this.sendRealTimeNotification(notificationData);
  }

  // Send bulk notifications
  async sendBulkRealTimeNotification(userIds: string[], notificationData: Omit<RealTimeNotificationData, 'userId'>) {
    const results: Array<{ success: boolean; userId: string; notificationId?: string; error?: string }> = [];
    
    for (const userId of userIds) {
      try {
        const result = await this.sendRealTimeNotification({
          ...notificationData,
          userId
        });
        results.push({ success: true, userId, notificationId: result.id });
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        results.push({ 
          success: false, 
          userId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return results;
  }

  // Send notification to role-based groups
  async sendRoleBasedNotification(roles: string[], notificationData: Omit<RealTimeNotificationData, 'userId'>) {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { in: roles },
          isActive: true
        },
        select: { id: true }
      });

      const userIds = users.map(user => user.id);
      return this.sendBulkRealTimeNotification(userIds, notificationData);
    } catch (error) {
      console.error('Error sending role-based notification:', error);
      throw error;
    }
  }

  // Send system-wide notification
  async sendSystemNotification(notificationData: Omit<RealTimeNotificationData, 'userId'>) {
    try {
      // Send to all connected users
      this.io.emit('notification:system', {
        ...notificationData,
        timestamp: new Date().toISOString()
      });

      // Save to database for all active users
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      const results: Array<{ success: boolean; userId: string; notificationId?: string; error?: string }> = [];
      for (const user of users) {
        try {
          const result = await this.sendRealTimeNotification({
            ...notificationData,
            userId: user.id
          });
          results.push({ success: true, userId: user.id, notificationId: result.id });
        } catch (error) {
          console.error(`Error sending system notification to user ${user.id}:`, error);
          results.push({ 
            success: false, 
            userId: user.id, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error sending system notification:', error);
      throw error;
    }
  }

  // Track user connection
  trackUserConnection(userId: string, socketId: string) {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)!.add(socketId);
  }

  // Track user disconnection
  trackUserDisconnection(userId: string, socketId: string) {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.activeConnections.delete(userId);
      }
    }
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.activeConnections.has(userId) && this.activeConnections.get(userId)!.size > 0;
  }

  // Get online users count
  getOnlineUsersCount(): number {
    return this.activeConnections.size;
  }

  // Get online users by role
  async getOnlineUsersByRole(role: string): Promise<number> {
    try {
      const onlineUserIds = Array.from(this.activeConnections.keys());
      const users = await prisma.user.count({
        where: {
          id: { in: onlineUserIds },
          role: role,
          isActive: true
        }
      });
      return users;
    } catch (error) {
      console.error('Error getting online users by role:', error);
      return 0;
    }
  }

  // Send push notification
  private async sendPushNotification(notificationData: RealTimeNotificationData) {
    try {
      // Get user's device tokens
      const user = await prisma.user.findUnique({
        where: { id: notificationData.userId },
        select: { 
          id: true, 
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (!user) return;

      // In a real implementation, you would send push notifications here
      // using services like Firebase Cloud Messaging, OneSignal, etc.
      console.log(`Push notification sent to user ${user.email}:`, {
        title: notificationData.title,
        message: notificationData.message,
        priority: notificationData.priority
      });

    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Get notification templates
  getNotificationTemplates(): NotificationTemplate[] {
    return Array.from(this.notificationTemplates.values());
  }

  // Update notification template
  updateNotificationTemplate(templateId: string, updates: Partial<NotificationTemplate>) {
    const template = this.notificationTemplates.get(templateId);
    if (template) {
      Object.assign(template, updates);
      this.notificationTemplates.set(templateId, template);
    }
  }

  // Create custom notification template
  createNotificationTemplate(template: Omit<NotificationTemplate, 'id'>) {
    const newTemplate: NotificationTemplate = {
      ...template,
      id: `custom_${Date.now()}`
    };
    this.notificationTemplates.set(newTemplate.id, newTemplate);
    return newTemplate;
  }

  // Send notification with retry logic
  async sendNotificationWithRetry(notificationData: RealTimeNotificationData, maxRetries: number = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await this.sendRealTimeNotification(notificationData);
      } catch (error) {
        attempts++;
        console.error(`Notification send attempt ${attempts} failed:`, error);
        
        if (attempts >= maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
  }

  // Schedule notification for future delivery
  async scheduleNotification(notificationData: RealTimeNotificationData, scheduledFor: Date) {
    try {
      // Save scheduled notification to database
      const scheduledNotification = await prisma.scheduledNotification.create({
        data: {
          userId: notificationData.userId,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          data: JSON.stringify(notificationData.data),
          scheduledFor: scheduledFor,
          isSent: false
        }
      });

      // In a real implementation, you would use a job queue like Bull, Agenda, etc.
      // For now, we'll use setTimeout (not recommended for production)
      const delay = scheduledFor.getTime() - Date.now();
      
      if (delay > 0) {
        setTimeout(async () => {
          try {
            await this.sendRealTimeNotification(notificationData);
            await prisma.scheduledNotification.update({
              where: { id: scheduledNotification.id },
              data: { isSent: true }
            });
          } catch (error) {
            console.error('Error sending scheduled notification:', error);
          }
        }, delay);
      }

      return scheduledNotification;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }
}

// Export singleton instance
let realTimeNotificationService: RealTimeNotificationService | null = null;

export const getRealTimeNotificationService = (io?: SocketIOServer, notificationService?: NotificationService): RealTimeNotificationService => {
  if (!realTimeNotificationService && io && notificationService) {
    realTimeNotificationService = new RealTimeNotificationService(io, notificationService);
  }
  return realTimeNotificationService!;
};
