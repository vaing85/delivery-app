import { Router } from 'express';
import { routeOptimizationService, Location, OptimizationOptions } from '../services/routeOptimizationService';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Get optimized routes for a driver
router.get('/driver/:driverId/routes', authenticateToken, async (req, res) => {
  try {
    const { driverId } = req.params;
    const { limit = 10 } = req.query;

    // Check if user can access this driver's routes
    const user = req.user;
    if (user?.role !== 'ADMIN' && user?.id !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const routes = await routeOptimizationService.getOptimizedRoutes(
      driverId,
      parseInt(limit as string)
    );

    res.json({
      success: true,
      data: routes
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch routes'
    });
  }
});

// Optimize routes for a driver
router.post('/optimize', authenticateToken, requireRole(['DRIVER', 'ADMIN']), async (req, res) => {
  try {
    const { locations, options } = req.body;
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    if (!locations || !Array.isArray(locations)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid locations data'
      });
    }

    // Validate locations
    const validLocations: Location[] = locations.map((loc: any) => ({
      id: loc.id || `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      address: loc.address || '',
      type: loc.type || 'delivery',
      orderId: loc.orderId,
      priority: loc.priority || 1,
      timeWindow: loc.timeWindow ? {
        start: new Date(loc.timeWindow.start),
        end: new Date(loc.timeWindow.end)
      } : undefined,
      estimatedDuration: loc.estimatedDuration || 10
    }));

    const optimizationOptions: OptimizationOptions = {
      algorithm: options?.algorithm || 'hybrid',
      maxRoutes: options?.maxRoutes || 5,
      maxStopsPerRoute: options?.maxStopsPerRoute || 15,
      timeLimit: options?.timeLimit || 30,
      considerTraffic: options?.considerTraffic || false,
      considerTimeWindows: options?.considerTimeWindows || true,
      considerDriverPreferences: options?.considerDriverPreferences || false,
      weightDistance: options?.weightDistance || 0.4,
      weightTime: options?.weightTime || 0.3,
      weightEarnings: options?.weightEarnings || 0.3
    };

    const result = await routeOptimizationService.optimizeRoutes(
      driverId,
      validLocations,
      optimizationOptions
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error optimizing routes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize routes'
    });
  }
});

// Optimize active deliveries for a driver
router.post('/optimize-active-deliveries', authenticateToken, requireRole(['DRIVER', 'ADMIN']), async (req, res) => {
  try {
    const driverId = req.user?.id;

    if (!driverId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const result = await routeOptimizationService.optimizeActiveDeliveries(driverId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error optimizing active deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to optimize active deliveries'
    });
  }
});

// Get route optimization algorithms
router.get('/algorithms', authenticateToken, async (req, res) => {
  try {
    const algorithms = [
      {
        id: 'nearest_neighbor',
        name: 'Nearest Neighbor',
        description: 'Simple greedy algorithm that always chooses the nearest unvisited location',
        complexity: 'O(n²)',
        bestFor: 'Quick optimization for small datasets',
        pros: ['Fast execution', 'Simple to understand', 'Good for small routes'],
        cons: ['Not optimal for complex routes', 'Can get stuck in local optima']
      },
      {
        id: 'genetic',
        name: 'Genetic Algorithm',
        description: 'Evolutionary algorithm that evolves better solutions over generations',
        complexity: 'O(g × p × n²)',
        bestFor: 'Complex routes with many constraints',
        pros: ['Handles complex constraints', 'Can find near-optimal solutions', 'Robust'],
        cons: ['Slower execution', 'Requires parameter tuning', 'May not guarantee optimality']
      },
      {
        id: 'simulated_annealing',
        name: 'Simulated Annealing',
        description: 'Probabilistic technique that accepts worse solutions to escape local optima',
        complexity: 'O(n²)',
        bestFor: 'Medium complexity routes with time constraints',
        pros: ['Good balance of speed and quality', 'Escapes local optima', 'Flexible'],
        cons: ['Requires temperature tuning', 'May not find global optimum']
      },
      {
        id: 'ant_colony',
        name: 'Ant Colony Optimization',
        description: 'Swarm intelligence algorithm inspired by ant foraging behavior',
        complexity: 'O(i × a × n²)',
        bestFor: 'Dynamic routing with changing conditions',
        pros: ['Adapts to changing conditions', 'Good for dynamic environments', 'Robust'],
        cons: ['Complex implementation', 'Slower convergence', 'Parameter sensitive']
      },
      {
        id: 'hybrid',
        name: 'Hybrid Algorithm',
        description: 'Combines multiple algorithms for optimal results',
        complexity: 'Variable',
        bestFor: 'Production environments requiring reliability',
        pros: ['Best overall performance', 'Robust and reliable', 'Adapts to different scenarios'],
        cons: ['More complex', 'Longer execution time', 'Higher resource usage']
      }
    ];

    res.json({
      success: true,
      data: algorithms
    });
  } catch (error) {
    console.error('Error fetching algorithms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch algorithms'
    });
  }
});

// Delete a route
router.delete('/routes/:routeId', authenticateToken, async (req, res) => {
  try {
    const { routeId } = req.params;
    const user = req.user;

    // Check if user can delete this route
    // This would require fetching the route first to check ownership
    // For now, we'll allow drivers to delete their own routes and admins to delete any route
    if (user?.role !== 'ADMIN') {
      // Additional check would be needed here to verify route ownership
    }

    const success = await routeOptimizationService.deleteRoute(routeId);

    if (success) {
      res.json({
        success: true,
        message: 'Route deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete route'
    });
  }
});

// Get route optimization statistics
router.get('/stats', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { startDate, endDate, driverId } = req.query;

    // This would typically fetch statistics from the database
    // For now, we'll return mock data
    const stats = {
      totalRoutes: 1250,
      totalDistance: 15420.5,
      totalDuration: 2840,
      totalEarnings: 45680.25,
      averageOptimizationTime: 2.3,
      algorithmUsage: {
        nearest_neighbor: 45,
        genetic: 20,
        simulated_annealing: 15,
        ant_colony: 10,
        hybrid: 10
      },
      performanceMetrics: {
        averageDistanceReduction: 15.2,
        averageTimeReduction: 12.8,
        averageEarningsIncrease: 8.5
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching route optimization stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Test route optimization with sample data
router.post('/test-optimization', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { algorithm = 'hybrid' } = req.body;
    const driverId = req.user?.id || 'test_driver';

    // Sample locations for testing
    const sampleLocations: Location[] = [
      {
        id: 'loc1',
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'New York, NY',
        type: 'pickup',
        priority: 1,
        estimatedDuration: 15
      },
      {
        id: 'loc2',
        latitude: 40.7589,
        longitude: -73.9851,
        address: 'Times Square, NY',
        type: 'delivery',
        priority: 2,
        estimatedDuration: 10
      },
      {
        id: 'loc3',
        latitude: 40.7505,
        longitude: -73.9934,
        address: 'Madison Square Garden, NY',
        type: 'pickup',
        priority: 1,
        estimatedDuration: 15
      },
      {
        id: 'loc4',
        latitude: 40.7614,
        longitude: -73.9776,
        address: 'Central Park, NY',
        type: 'delivery',
        priority: 3,
        estimatedDuration: 10
      },
      {
        id: 'loc5',
        latitude: 40.6892,
        longitude: -74.0445,
        address: 'Statue of Liberty, NY',
        type: 'delivery',
        priority: 2,
        estimatedDuration: 10
      }
    ];

    const options: OptimizationOptions = {
      algorithm: algorithm as any,
      maxStopsPerRoute: 10,
      considerTimeWindows: true,
      weightDistance: 0.4,
      weightTime: 0.3,
      weightEarnings: 0.3
    };

    const result = await routeOptimizationService.optimizeRoutes(
      driverId,
      sampleLocations,
      options
    );

    res.json({
      success: true,
      data: {
        ...result,
        sampleData: true,
        message: 'This is a test optimization with sample data'
      }
    });
  } catch (error) {
    console.error('Error in test optimization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform test optimization'
    });
  }
});

export default router;
