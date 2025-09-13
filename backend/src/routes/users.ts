import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireRole } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error'
      }
    });
  }
});

// @route   POST /api/users/upgrade-to-admin
// @desc    Upgrade current user to admin role (Development only)
// @access  Private
router.post('/upgrade-to-admin', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated'
        }
      });
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'User upgraded to admin successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error upgrading user to admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error'
      }
    });
  }
});

// @route   GET /api/users/basic
// @desc    Get basic user information for authenticated users (useful for seeing available drivers)
// @access  Private (All authenticated users)
router.get('/basic', authenticateToken, [
  query('role').optional().isIn(['CUSTOMER', 'DRIVER', 'ADMIN', 'DISPATCHER']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { role, isActive, search, limit = 50 } = req.query as any;

    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        driverProfile: {
          select: {
            isAvailable: true,
            totalDeliveries: true,
            rating: true
          }
        }
      },
      take: Number(limit),
      orderBy: { firstName: 'asc' }
    });

    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get basic users error:', error);
    return res.status(500).json({
      success: false,
      error: { 
        message: 'Failed to get users' 
      }
    });
  }
});

// @route   GET /api/users
// @desc    Get all users with filtering and pagination
// @access  Private (Admin and Business only)
router.get('/', authenticateToken, requireRole(['ADMIN', 'BUSINESS']), [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('role').optional().isIn(['CUSTOMER', 'DRIVER', 'ADMIN', 'DISPATCHER']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  query('search').optional().isString().withMessage('Search must be a string'),
  query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date format')
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { page = 1, limit = 10, role, search, isActive, startDate, endDate } = req.query as any;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    
    if (role) {
      where.role = role;
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          driverProfile: {
            select: {
              isAvailable: true,
              totalDeliveries: true,
              rating: true
            }
          },
          customerProfile: {
            select: {
              totalOrders: true,
              totalSpent: true,
              loyaltyPoints: true
            }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get users'
      }
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;
    const currentUserRole = (req as any).user?.role;

    // Users can only view their own profile unless they're admin
    if (id !== currentUserId && currentUserRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        avatar: true,
        dateOfBirth: true,
        createdAt: true,
        updatedAt: true,
        driverProfile: true,
        customerProfile: true,
        address: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    return res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user'
      }
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;
    const currentUserRole = (req as any).user?.role;

    // Users can only update their own profile unless they're admin
    if (id !== currentUserId && currentUserRole !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied'
        }
      });
    }

    const { firstName, lastName, phone, avatar, dateOfBirth } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        avatar,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        dateOfBirth: true,
        updatedAt: true
      }
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile'
      }
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (admin only)
// @access  Private/Admin
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    // Soft delete - mark as inactive instead of actually deleting
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete user'
      }
    });
  }
});

// @route   GET /api/users/drivers/available
// @desc    Get available drivers
// @access  Private
router.get('/drivers/available', authenticateToken, async (req, res) => {
  try {
    const drivers = await prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isActive: true,
        driverProfile: {
          isAvailable: true
        }
      },
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
            currentLocationLat: true,
            currentLocationLng: true,
            rating: true,
            totalDeliveries: true
          }
        }
      }
    });

    return res.json({
      success: true,
      data: { drivers }
    });
  } catch (error) {
    console.error('Get available drivers error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get available drivers'
      }
    });
  }
});

// @route   POST /api/users/upgrade-to-admin
// @desc    Upgrade current user to admin role (Development only)
// @access  Private
router.post('/upgrade-to-admin', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not authenticated'
        }
      });
    }

    // Update user role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'User upgraded to admin successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error upgrading user to admin:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error'
      }
    });
  }
});

// @route   PUT /api/users/driver/profile
// @desc    Update driver profile (availability, location, etc.)
// @access  Private (Driver only)
router.put('/driver/profile', authenticateToken, [
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  body('currentLocationLat').optional().isFloat().withMessage('Latitude must be a valid number'),
  body('currentLocationLng').optional().isFloat().withMessage('Longitude must be a valid number'),
  body('vehicleType').optional().isIn(['CAR', 'MOTORCYCLE', 'BICYCLE', 'TRUCK']).withMessage('Invalid vehicle type'),
  body('vehicleModel').optional().isString().withMessage('Vehicle model must be a string')
], async (req, res) => {
  try {
    // Check if user is authenticated and is a driver
    if (!req.user || req.user.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Driver privileges required.'
        }
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { isAvailable, currentLocationLat, currentLocationLng, vehicleType, vehicleModel } = req.body;

    // Update driver profile
    const updatedProfile = await prisma.driverProfile.update({
      where: { userId: req.user.id },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(currentLocationLat !== undefined && { currentLocationLat }),
        ...(currentLocationLng !== undefined && { currentLocationLng }),
        ...(vehicleType && { vehicleType }),
        ...(vehicleModel && { vehicleModel })
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return res.json({
      success: true,
      message: 'Driver profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Update driver profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update driver profile'
      }
    });
  }
});

// @route   GET /api/users/driver/profile
// @desc    Get current driver's profile
// @access  Private (Driver only)
router.get('/driver/profile', authenticateToken, async (req, res) => {
  try {
    // Check if user is authenticated and is a driver
    if (!req.user || req.user.role !== 'DRIVER') {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Driver privileges required.'
        }
      });
    }

    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true
          }
        }
      }
    });

    if (!driverProfile) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Driver profile not found'
        }
      });
    }

    return res.json({
      success: true,
      data: driverProfile
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get driver profile'
      }
    });
  }
});

// @route   POST /api/users/admin/register-driver
// @desc    Admin or Business registers a new driver
// @access  Private (Admin or Business only)
router.post('/admin/register-driver', 
  authenticateToken,
  requireRole(['ADMIN', 'BUSINESS']),
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('vehicleType').notEmpty().withMessage('Vehicle type is required'),
    body('vehicleModel').notEmpty().withMessage('Vehicle model is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            details: errors.array()
          }
        });
      }

      const { firstName, lastName, email, phone, vehicleType, vehicleModel } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User with this email already exists'
          }
        });
      }

      // Generate a temporary password (in production, you might want to send this via email)
      const tempPassword = Math.random().toString(36).slice(-8);

      // Generate a unique license number (in production, this should be provided by the driver)
      const licenseNumber = `DL${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create the driver user with driver profile
      const newDriver = await prisma.user.create({
        data: {
          email,
          password: tempPassword, // In production, this should be hashed
          firstName,
          lastName,
          phone,
          role: 'DRIVER',
          isActive: true,
          driverProfile: {
            create: {
              licenseNumber,
              vehicleType,
              vehicleModel,
              isAvailable: true,
              backgroundCheck: false, // Will need to be completed later
              rating: 0.0,
              totalDeliveries: 0
            }
          }
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          driverProfile: {
            select: {
              id: true,
              licenseNumber: true,
              vehicleType: true,
              vehicleModel: true,
              isAvailable: true,
              rating: true,
              totalDeliveries: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: {
          driver: newDriver,
          tempPassword, // In production, don't return this
          message: 'Driver registered successfully with profile. Temporary password generated for first login.'
        }
      });

    } catch (error) {
      console.error('Error registering driver:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Internal server error'
        }
      });
    }
  }
);

export default router;
