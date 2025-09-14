import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { initializeSocketIO } from './services/socketService';
import PortManager from './utils/portManager';

// Load environment variables
dotenv.config();

// Environment configuration
const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
};

// Initialize Prisma client
const prisma = new PrismaClient();

// Initialize Express app
const app = express();

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: [config.CORS_ORIGIN, 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io available to routes
app.locals.io = io;

// Initialize notification service
import { NotificationService } from './services/notificationService';
import { getRealTimeNotificationService } from './services/realTimeNotificationService';

const notificationService = new NotificationService(io);
const realTimeNotificationService = getRealTimeNotificationService(io, notificationService);

// Make services available to routes and socket service
app.locals.notificationService = notificationService;
app.locals.realTimeNotificationService = realTimeNotificationService;
(io as any).realTimeNotificationService = realTimeNotificationService;

// Initialize Socket.IO handlers
initializeSocketIO(io);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [config.CORS_ORIGIN, 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting - TEMPORARILY DISABLED to fix authentication issues
// const limiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '300000'), // 5 minutes for development
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000'), // limit each IP to 10000 requests per windowMs for development
//   message: {
//     success: false,
//     error: {
//       message: 'Too many requests from this IP, please try again later.'
//     }
//   },
//   standardHeaders: true,
//   legacyHeaders: false
// });
// app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Static uploads
const uploadDir = process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// Minimal upload route using Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE || 10485760) },
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({ success: true, data: { url: fileUrl, filename: req.file.originalname } });
});

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
      database: 'Connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.NODE_ENV,
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Basic API endpoint
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'Delivery App Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Import route modules
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import orderRoutes from './routes/orders';
import deliveryRoutes from './routes/deliveries';
import notificationRoutes from './routes/notifications';
import realTimeNotificationRoutes from './routes/realTimeNotifications';
import analyticsRoutes from './routes/analytics';
import photoRoutes from './routes/photos';
import signatureRoutes from './routes/signatures';
import driverRoutes from './routes/driver';
import routeOptimizationRoutes from './routes/routeOptimization';
import paymentRoutes from './routes/payments';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/real-time-notifications', realTimeNotificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/signatures', signatureRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/route-optimization', routeOptimizationRoutes);
app.use('/api/payments', paymentRoutes);

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
  const portManager = PortManager.getInstance();
  portManager.cleanup();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  const portManager = PortManager.getInstance();
  portManager.cleanup();
  await prisma.$disconnect();
  process.exit(0);
});

// Start server with port management
const startServer = async () => {
  try {
    const portManager = PortManager.getInstance();
    
    // Try to kill any existing process on the preferred port
    await portManager.killProcessOnPort(Number(config.PORT));
    
    // Find an available port
    const availablePort = await portManager.findAvailablePort({
      preferredPort: Number(config.PORT),
      maxAttempts: 5,
      portRange: { start: 5000, end: 5010 }
    });

    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Start server on available port
    server.listen(availablePort, () => {
      console.log(`🚀 Delivery App Backend Server running on port ${availablePort}`);
      console.log(`📱 Environment: ${config.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${availablePort}/health`);
      console.log(`🧪 Test endpoint: http://localhost:${availablePort}/api/test`);
      console.log(`🔐 Auth endpoints: http://localhost:${availablePort}/api/auth`);
      console.log(`📦 Order endpoints: http://localhost:${availablePort}/api/orders`);
      console.log(`🚚 Delivery endpoints: http://localhost:${availablePort}/api/deliveries`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${availablePort} is in use, trying to find another...`);
        portManager.releasePort(availablePort);
        startServer(); // Retry with a new port
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
