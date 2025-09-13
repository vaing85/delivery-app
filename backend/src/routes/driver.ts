import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { getMapService } from '../services/mapService';
import { getNotificationService } from '../services/notificationService';
import { photoUpload, savePhotoMetadata } from '../services/photoService';

const router = express.Router();
const prisma = new PrismaClient();

// Update driver location
router.post('/location', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, accuracy, timestamp } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Update driver profile with current location
    const updatedDriver = await prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        currentLocationLat: latitude,
        currentLocationLng: longitude,
        lastActive: new Date()
      },
      include: {
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

    // Emit location update to connected clients via WebSocket
    // This will be implemented in the socket service
    req.app.locals.io?.emit('driverLocationUpdate', {
      driverId,
      location: { latitude, longitude },
      accuracy,
      timestamp: timestamp || new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        driver: updatedDriver,
        location: { latitude, longitude, accuracy }
      }
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update location' }
    });
  }
});

// Get driver's current location
router.get('/location', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: {
        currentLocationLat: true,
        currentLocationLng: true,
        lastActive: true
      }
    });

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        error: { message: 'Driver profile not found' }
      });
    }

    res.json({
      success: true,
      data: {
        location: {
          latitude: driverProfile.currentLocationLat,
          longitude: driverProfile.currentLocationLng
        },
        lastActive: driverProfile.lastActive
      }
    });
  } catch (error) {
    console.error('Error getting driver location:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get location' }
    });
  }
});

// Update driver status (online/offline, available/busy)
router.patch('/status', authenticateToken, async (req, res) => {
  try {
    const { isAvailable, status } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    const updatedDriver = await prisma.driverProfile.update({
      where: { userId: driverId },
      data: {
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        lastActive: new Date()
      },
      include: {
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

    // Emit status update to connected clients
    req.app.locals.io?.emit('driverStatusUpdate', {
      driverId,
      isAvailable: updatedDriver.isAvailable,
      status,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: { driver: updatedDriver }
    });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update status' }
    });
  }
});

// Get driver performance analytics
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { period = '30d' } = req.query;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get delivery statistics
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        createdAt: { gte: startDate }
      },
      include: {
        order: {
          select: {
            status: true,
            actualDelivery: true,
            scheduledDelivery: true
          }
        }
      }
    });

    // Calculate metrics
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(d => d.order.status === 'DELIVERED').length;
    const onTimeDeliveries = deliveries.filter(d => {
      if (!d.order.actualDelivery || !d.order.scheduledDelivery) return false;
      return d.order.actualDelivery <= d.order.scheduledDelivery;
    }).length;

    const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
    const completionRate = totalDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0;

    // Get driver profile for rating
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      select: {
        rating: true,
        totalDeliveries: true
      }
    });

    res.json({
      success: true,
      data: {
        period,
        metrics: {
          totalDeliveries,
          completedDeliveries,
          onTimeDeliveries,
          onTimeRate: Math.round(onTimeRate * 100) / 100,
          completionRate: Math.round(completionRate * 100) / 100,
          averageRating: driverProfile?.rating || 0,
          totalDeliveriesAllTime: driverProfile?.totalDeliveries || 0
        },
        deliveries: deliveries.map(d => ({
          id: d.id,
          orderId: d.orderId,
          status: d.status,
          startTime: d.startTime,
          endTime: d.endTime,
          distance: d.distance,
          onTime: d.order.actualDelivery && d.order.scheduledDelivery 
            ? d.order.actualDelivery <= d.order.scheduledDelivery 
            : null
        }))
      }
    });
  } catch (error) {
    console.error('Error getting driver analytics:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get analytics' }
    });
  }
});

// Get driver earnings
router.get('/earnings', authenticateToken, async (req, res) => {
  try {
    const driverId = req.user?.id;
    const { period = '30d' } = req.query;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get completed deliveries with earnings
    const deliveries = await prisma.delivery.findMany({
      where: {
        driverId,
        status: 'DELIVERED',
        createdAt: { gte: startDate }
      },
      include: {
        order: {
          select: {
            deliveryFee: true,
            tip: true,
            total: true,
            actualDelivery: true
          }
        }
      }
    });

    // Calculate earnings
    const totalEarnings = deliveries.reduce((sum, d) => {
      return sum + (d.order.deliveryFee || 0) + (d.order.tip || 0);
    }, 0);

    const totalDeliveries = deliveries.length;
    const averageEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;

    // Mock payment history (in real app, this would come from a payments table)
    const paymentHistory = deliveries.map((d, index) => ({
      id: `payment_${d.id}`,
      amount: (d.order.deliveryFee || 0) + (d.order.tip || 0),
      type: 'DELIVERY_PAYMENT',
      status: 'COMPLETED',
      date: d.order.actualDelivery || d.createdAt,
      deliveryId: d.id
    }));

    res.json({
      success: true,
      data: {
        period,
        earnings: {
          totalEarnings: Math.round(totalEarnings * 100) / 100,
          totalDeliveries,
          averageEarningsPerDelivery: Math.round(averageEarningsPerDelivery * 100) / 100,
          pendingPayout: 0, // Would be calculated from pending payments
          lastPayoutDate: null // Would come from actual payout records
        },
        paymentHistory: paymentHistory.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      }
    });
  } catch (error) {
    console.error('Error getting driver earnings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get earnings' }
    });
  }
});

// Route optimization endpoint
router.post('/route/optimize', authenticateToken, async (req, res) => {
  try {
    const { deliveries, currentLocation } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized' }
      });
    }

    // Get map service
    const mapService = getMapService();

    // Convert deliveries to route points
    const routePoints = deliveries.map((delivery: any) => ({
      location: {
        latitude: delivery.latitude,
        longitude: delivery.longitude
      },
      orderId: delivery.orderId
    }));

    // Add current location as starting point
    const allPoints = [
      { location: currentLocation },
      ...routePoints
    ];

    // Optimize route using map service
    const optimizedRoute = await mapService.optimizeRoute(allPoints);

    // Format response
    const response = {
      deliveries: deliveries.map((delivery: any, index: number) => ({
        ...delivery,
        optimizedOrder: index + 1,
        estimatedArrival: new Date(Date.now() + (index + 1) * 15 * 60000).toISOString(),
        distance: optimizedRoute.points[index + 1]?.estimatedDistance || 0,
        duration: optimizedRoute.points[index + 1]?.estimatedDuration || 0
      })),
      totalDistance: optimizedRoute.totalDistance,
      totalDuration: optimizedRoute.totalDuration,
      fuelEfficiency: optimizedRoute.totalDistance < 20 ? 'Excellent' : optimizedRoute.totalDistance < 40 ? 'Good' : 'Fair',
      isOptimized: optimizedRoute.isOptimized,
      optimizationTimestamp: optimizedRoute.optimizationTimestamp,
      polyline: optimizedRoute.polyline
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error optimizing route:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to optimize route' }
    });
  }
});

// Upload delivery photo
router.post('/photo/upload', authenticateToken, photoUpload.single('photo'), async (req, res) => {
  try {
    const { orderId, photoType, description } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
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

    // Save photo metadata to database
    const photo = await savePhotoMetadata({
      orderId,
      userId: driverId,
      photoUrl: `/uploads/photos/${req.file.filename}`,
      photoType: photoType as 'PICKUP' | 'DELIVERY' | 'DAMAGE' | 'ISSUE',
      description,
      metadata: {
        filename: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

    // Get notification service and send notification
    const notificationService = getNotificationService(req.app.locals.io);
    await notificationService.sendNotification({
      userId: (photo.order.customer as any).id,
      title: 'Delivery Photo Received',
      message: `A ${photoType.toLowerCase()} photo has been uploaded for order #${photo.order.orderNumber}`,
      type: 'DELIVERY_STATUS',
      data: { orderId, photoId: photo.id, photoType }
    });

    res.json({
      success: true,
      data: { photo }
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload photo' }
    });
  }
});

// Get nearby drivers (for admin/dispatcher)
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, limit = 20 } = req.query;
    const userRole = req.user?.role;

    // Only admin and dispatcher can access this endpoint
    if (userRole !== 'ADMIN' && userRole !== 'DISPATCHER') {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: { message: 'Latitude and longitude are required' }
      });
    }

    // Get available drivers within radius
    const drivers = await prisma.driverProfile.findMany({
      where: {
        isAvailable: true,
        currentLocationLat: {
          gte: parseFloat(latitude as string) - parseFloat(radius as string) / 111, // Rough conversion
          lte: parseFloat(latitude as string) + parseFloat(radius as string) / 111
        },
        currentLocationLng: {
          gte: parseFloat(longitude as string) - parseFloat(radius as string) / 111,
          lte: parseFloat(longitude as string) + parseFloat(radius as string) / 111
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      take: parseInt(limit as string)
    });

    // Calculate distances (simplified)
    const driversWithDistance = drivers.map(driver => {
      const distance = Math.sqrt(
        Math.pow((driver.currentLocationLat || 0) - parseFloat(latitude as string), 2) +
        Math.pow((driver.currentLocationLng || 0) - parseFloat(longitude as string), 2)
      ) * 111; // Rough conversion to km

      return {
        ...driver,
        distance: Math.round(distance * 100) / 100
      };
    });

    res.json({
      success: true,
      data: {
        drivers: driversWithDistance.sort((a, b) => a.distance - b.distance),
        total: driversWithDistance.length,
        searchCenter: { latitude: parseFloat(latitude as string), longitude: parseFloat(longitude as string) },
        radius: parseFloat(radius as string)
      }
    });
  } catch (error) {
    console.error('Error getting nearby drivers:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get nearby drivers' }
    });
  }
});

export default router;
