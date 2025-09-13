import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const initializeSocketIO = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.replace('Bearer ', '');
      
      // Verify JWT token
      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET!) as any;
      
      // Get user from database
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      // Attach user info to socket
      socket.userId = user.id;
      socket.userRole = user.role;
      
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected with role ${socket.userRole}`);
    
    // Track user connection for real-time notifications
    const realTimeNotificationService = (io as any).realTimeNotificationService;
    if (realTimeNotificationService) {
      realTimeNotificationService.trackUserConnection(socket.userId!, socket.id);
    }

    // Join user to their personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      
      // Join role-based rooms
      socket.join(`role:${socket.userRole}`);
      
      // If driver, join driver-specific room
      if (socket.userRole === 'DRIVER') {
        socket.join('drivers');
      }
      
      // If admin, join admin room
      if (socket.userRole === 'ADMIN') {
        socket.join('admins');
      }
    }

    // Handle order updates
    socket.on('order:update', async (data) => {
      try {
        const { orderId, status, location } = data;
        
        // Emit to order-specific room
        io.to(`order:${orderId}`).emit('order:updated', {
          orderId,
          status,
          location,
          timestamp: new Date().toISOString()
        });

        // Emit to relevant role rooms
        if (status === 'ASSIGNED' || status === 'PICKED_UP' || status === 'IN_TRANSIT') {
          io.to('drivers').emit('order:status:changed', {
            orderId,
            status,
            timestamp: new Date().toISOString()
          });
        }

        if (status === 'DELIVERED' || status === 'FAILED') {
          io.to('admins').emit('order:completed', {
            orderId,
            status,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error handling order update:', error);
      }
    });

    // Handle location updates (for drivers)
    socket.on('location:update', async (data) => {
      try {
        const { latitude, longitude, orderId } = data;
        
        if (socket.userRole === 'DRIVER' && socket.userId) {
          // Update driver's current location in database
          await prisma.driverProfile.updateMany({
            where: { userId: socket.userId },
            data: {
              currentLocationLat: latitude,
              currentLocationLng: longitude,
              lastActive: new Date()
            }
          });

          // Emit location update to relevant parties
          if (orderId) {
            io.to(`order:${orderId}`).emit('driver:location:updated', {
              driverId: socket.userId,
              latitude,
              longitude,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error('Error handling location update:', error);
      }
    });

    // Handle delivery status updates
    socket.on('delivery:status:update', async (data) => {
      try {
        const { deliveryId, status, notes } = data;
        
        // Emit to delivery-specific room
        io.to(`delivery:${deliveryId}`).emit('delivery:status:updated', {
          deliveryId,
          status,
          notes,
          timestamp: new Date().toISOString()
        });

        // Emit to admin room for monitoring
        io.to('admins').emit('delivery:status:changed', {
          deliveryId,
          status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling delivery status update:', error);
      }
    });

    // Handle signature capture
    socket.on('signature:captured', async (data) => {
      try {
        const { orderId, signatureData, signatureType } = data;
        
        // Emit to order room
        io.to(`order:${orderId}`).emit('signature:received', {
          orderId,
          signatureType,
          timestamp: new Date().toISOString()
        });

        // Emit to admin room
        io.to('admins').emit('signature:captured', {
          orderId,
          signatureType,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling signature capture:', error);
      }
    });

    // Handle photo capture
    socket.on('photo:captured', async (data) => {
      try {
        const { orderId, photoType, photoUrl } = data;
        
        // Emit to order room
        io.to(`order:${orderId}`).emit('photo:received', {
          orderId,
          photoType,
          photoUrl,
          timestamp: new Date().toISOString()
        });

        // Emit to admin room
        io.to('admins').emit('photo:captured', {
          orderId,
          photoType,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling photo capture:', error);
      }
    });

    // Handle chat messages
    socket.on('chat:message', async (data) => {
      try {
        const { orderId, message, recipientId } = data;
        
        // Emit to specific recipient
        io.to(`user:${recipientId}`).emit('chat:message:received', {
          orderId,
          message,
          senderId: socket.userId,
          timestamp: new Date().toISOString()
        });

        // Emit back to sender for confirmation
        socket.emit('chat:message:sent', {
          orderId,
          message,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling chat message:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        // Track user disconnection for real-time notifications
        const realTimeNotificationService = (io as any).realTimeNotificationService;
        if (realTimeNotificationService && socket.userId) {
          realTimeNotificationService.trackUserDisconnection(socket.userId, socket.id);
        }

        if (socket.userId && socket.userRole === 'DRIVER') {
          // Update driver's availability status
          await prisma.driverProfile.updateMany({
            where: { userId: socket.userId },
            data: { isAvailable: false }
          });

          // Notify admins about driver going offline
          io.to('admins').emit('driver:offline', {
            driverId: socket.userId,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`User ${socket.userId} disconnected`);
      } catch (error) {
        console.error('Error handling disconnection:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Broadcast system notifications
  const broadcastSystemNotification = (notification: any) => {
    io.emit('system:notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });
  };

  // Export for use in other parts of the application
  (io as any).broadcastSystemNotification = broadcastSystemNotification;
};
