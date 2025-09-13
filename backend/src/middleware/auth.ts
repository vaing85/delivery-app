import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required'
        }
      });
    }

    // Verify token
    const jwtSecret = (process.env.JWT_SECRET || 'fallback-secret-key') as unknown as jwt.Secret;
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found or inactive'
        }
      });
    }

    // Add user to request object
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token'
        }
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired'
        }
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed'
      }
    });
  }
};

// Role-based access control middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required'
        }
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions'
        }
      });
    }

    return next();
  };
};

// Specific role middlewares
export const requireAdmin = requireRole(['ADMIN']);
export const requireDriver = requireRole(['DRIVER', 'ADMIN']);
export const requireCustomer = requireRole(['CUSTOMER', 'DRIVER', 'ADMIN']);
export const requireDispatcher = requireRole(['DISPATCHER', 'ADMIN']);
