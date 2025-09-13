import express from 'express';
import { analyticsService } from '../services/analyticsService';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';

const router = express.Router();

// Apply authentication to all analytics routes
router.use(authenticateToken);

// Get revenue analytics
router.get('/revenue', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getRevenueAnalytics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics'
    });
  }
});

// Get delivery analytics
router.get('/deliveries', requireRole(['ADMIN', 'BUSINESS', 'DRIVER']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getDeliveryAnalytics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching delivery analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery analytics'
    });
  }
});

// Get driver analytics
router.get('/drivers', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getDriverAnalytics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching driver analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver analytics'
    });
  }
});

// Get customer analytics
router.get('/customers', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getCustomerAnalytics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics'
    });
  }
});

// Get geographic analytics
router.get('/geographic', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getGeographicAnalytics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching geographic analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geographic analytics'
    });
  }
});

// Get business metrics
router.get('/business', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    const analytics = await analyticsService.getBusinessMetrics(timeRange);
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business metrics'
    });
  }
});

// Get comprehensive analytics dashboard
router.get('/dashboard', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const timeRange = {
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string)
    };

    // Fetch all analytics in parallel
    const [
      revenueAnalytics,
      deliveryAnalytics,
      driverAnalytics,
      customerAnalytics,
      geographicAnalytics,
      businessMetrics
    ] = await Promise.all([
      analyticsService.getRevenueAnalytics(timeRange),
      analyticsService.getDeliveryAnalytics(timeRange),
      analyticsService.getDriverAnalytics(timeRange),
      analyticsService.getCustomerAnalytics(timeRange),
      analyticsService.getGeographicAnalytics(timeRange),
      analyticsService.getBusinessMetrics(timeRange)
    ]);

    const dashboard = {
      revenue: revenueAnalytics,
      deliveries: deliveryAnalytics,
      drivers: driverAnalytics,
      customers: customerAnalytics,
      geographic: geographicAnalytics,
      business: businessMetrics,
      timeRange
    };
    
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error fetching analytics dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics dashboard'
    });
  }
});

// Get analytics summary for quick overview
router.get('/summary', requireRole(['ADMIN', 'BUSINESS']), async (req, res) => {
  try {
    // Default to last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const timeRange = { startDate, endDate };

    const [revenueAnalytics, deliveryAnalytics, businessMetrics] = await Promise.all([
      analyticsService.getRevenueAnalytics(timeRange),
      analyticsService.getDeliveryAnalytics(timeRange),
      analyticsService.getBusinessMetrics(timeRange)
    ]);

    const summary = {
      totalRevenue: revenueAnalytics.totalRevenue,
      totalOrders: businessMetrics.totalOrders,
      totalDeliveries: deliveryAnalytics.totalDeliveries,
      averageOrderValue: revenueAnalytics.averageOrderValue,
      deliverySuccessRate: deliveryAnalytics.deliverySuccessRate,
      revenueGrowth: revenueAnalytics.revenueGrowth,
      orderGrowthRate: businessMetrics.orderGrowthRate,
      customerSatisfactionScore: businessMetrics.customerSatisfactionScore
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary'
    });
  }
});

export default router;

