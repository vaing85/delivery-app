import { Request, Response, NextFunction } from 'express';
import { logAPI, logPerformance, logSecurity } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Request timing middleware
export const requestTiming = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Store start time in request object
  (req as any).startTime = startTime;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    // Log API call
    logAPI(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      (req as any).user?.id
    );
    
    // Log performance if slow
    if (duration > 1000) {
      logPerformance('Slow API Response', duration, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        user: (req as any).user?.id
      });
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

// Security monitoring middleware
export const securityMonitoring = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript injection
    /onload=/i,  // Event handler injection
  ];
  
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
      logSecurity('Suspicious Request Pattern', {
        pattern: pattern.toString(),
        url,
        body: body.substring(0, 200),
        query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: (req as any).user?.id
      });
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Suspicious request detected'
        }
      });
    }
  }
  
  next();
};

// Rate limiting monitoring
export const rateLimitMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip;
  const user = (req as any).user?.id;
  
  // Log rate limit hits
  res.on('close', () => {
    if (res.statusCode === 429) {
      logSecurity('Rate Limit Exceeded', {
        ip,
        user,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
    }
  });
  
  next();
};

// Database query monitoring
export const databaseMonitoring = () => {
  // Monitor Prisma queries
  prisma.$use(async (params, next) => {
    const startTime = Date.now();
    
    try {
      const result = await next(params);
      const duration = Date.now() - startTime;
      
      // Log slow queries
      if (duration > 100) {
        logPerformance('Slow Database Query', duration, {
          model: params.model,
          action: params.action,
          args: JSON.stringify(params.args).substring(0, 200)
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logPerformance('Database Query Error', duration, {
        model: params.model,
        action: params.action,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  });
};

// Memory usage monitoring
export const memoryMonitoring = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const memoryUsage = {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
    };
    
    // Log if memory usage is high
    if (memoryUsage.heapUsed > 100) {
      logPerformance('High Memory Usage', 0, memoryUsage);
    }
  }, 30000); // Check every 30 seconds
};

// Error monitoring
export const errorMonitoring = (error: Error, req: Request, res: Response, next: NextFunction) => {
  logSecurity('Application Error', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: (req as any).user?.id,
    body: JSON.stringify(req.body).substring(0, 200)
  });
  
  next(error);
};

// Health check monitoring
export const healthCheckMonitoring = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/health') {
    const startTime = Date.now();
    
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      const duration = Date.now() - startTime;
      logPerformance('Health Check', duration, {
        status: 'healthy',
        database: 'connected'
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logPerformance('Health Check', duration, {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  next();
};
