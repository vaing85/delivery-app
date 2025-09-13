import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Environment configuration with fallbacks
const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  // Database fallback - use the values from your docker-compose
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://delivery_user:delivery_password@localhost:5432/delivery_app_db'
};

// Initialize Prisma client with fallback config
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.DATABASE_URL
    }
  }
});

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [config.CORS_ORIGIN, 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: 'Connected',
      port: config.PORT
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      port: config.PORT
    });
  }
});

// Basic API endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Delivery App Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: config.PORT
  });
});

// Simple auth endpoints for testing
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple mock authentication
  if (email === 'admin@deliveryapp.com' && password === 'admin123') {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 'admin-1',
          email: 'admin@deliveryapp.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN'
        },
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid credentials'
      }
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, firstName, lastName, role = 'CUSTOMER' } = req.body;
  
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: 'user-1',
        email,
        firstName,
        lastName,
        role
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    }
  });
});

// Simple orders endpoint for testing
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      take: 10,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        items: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: 1,
        limit: 10,
        total: orders.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders'
      }
    });
  }
});

// Simple users endpoint for testing
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: 1,
        limit: 10,
        total: users.length,
        pages: 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch users'
      }
    });
  }
});

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Global error handler
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation error',
        details: error.details
      }
    });
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Database operation failed',
        details: error.message
      }
    });
  }

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error'
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const server = app.listen(config.PORT, async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    console.log(`🚀 Delivery App Backend Server running on port ${config.PORT}`);
    console.log(`📱 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${config.PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${config.PORT}/api/test`);
    console.log(`🔐 Auth endpoints: http://localhost:${config.PORT}/api/auth`);
    console.log(`📦 Order endpoints: http://localhost:${config.PORT}/api/orders`);
    console.log(`👥 User endpoints: http://localhost:${config.PORT}/api/users`);
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    console.log('⚠️  Server starting without database connection...');
    console.log(`🚀 Delivery App Backend Server running on port ${config.PORT}`);
    console.log(`📱 Environment: ${config.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${config.PORT}/health`);
    console.log(`🧪 Test endpoint: http://localhost:${config.PORT}/api/test`);
  }
});

export default app;
