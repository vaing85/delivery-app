import { Request, Response, NextFunction } from 'express';
import { logPerformance } from '../utils/logger';

// Performance monitoring middleware
export const performanceMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  // Store start time in request object
  (req as any).startTime = startTime;
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    logPerformance('API Request', duration, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      user: (req as any).user?.id
    });
    
    // Log slow requests
    if (duration > 1000) {
      logPerformance('Slow API Request', duration, {
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

// Database query performance monitoring
export const databasePerformanceMonitoring = () => {
  // This would be implemented in the Prisma client setup
  // See database monitoring in monitoring.ts
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
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024) // MB
    };
    
    // Log if memory usage is high
    if (memoryUsage.heapUsed > 100) {
      logPerformance('High Memory Usage', 0, memoryUsage);
    }
    
    // Log if memory usage is very high
    if (memoryUsage.heapUsed > 200) {
      logPerformance('Critical Memory Usage', 0, memoryUsage);
    }
  }, 30000); // Check every 30 seconds
};

// CPU usage monitoring
export const cpuMonitoring = () => {
  let lastCpuUsage = process.cpuUsage();
  let lastTime = Date.now();
  
  setInterval(() => {
    const currentCpuUsage = process.cpuUsage(lastCpuUsage);
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTime;
    
    const cpuPercent = (currentCpuUsage.user + currentCpuUsage.system) / (timeDiff * 1000) * 100;
    
    if (cpuPercent > 80) {
      logPerformance('High CPU Usage', cpuPercent, {
        user: currentCpuUsage.user,
        system: currentCpuUsage.system,
        timeDiff
      });
    }
    
    lastCpuUsage = currentCpuUsage;
    lastTime = currentTime;
  }, 10000); // Check every 10 seconds
};

// Response time tracking
export const responseTimeTracking = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Add response time header
    res.set('X-Response-Time', `${duration}ms`);
    
    // Log response time metrics
    if (duration > 500) {
      logPerformance('Slow Response', duration, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode
      });
    }
  });
  
  next();
};

// Cache performance monitoring
export const cachePerformanceMonitoring = () => {
  const cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  return {
    recordHit: () => cacheStats.hits++,
    recordMiss: () => cacheStats.misses++,
    recordSet: () => cacheStats.sets++,
    recordDelete: () => cacheStats.deletes++,
    getStats: () => ({ ...cacheStats }),
    getHitRate: () => cacheStats.hits / (cacheStats.hits + cacheStats.misses) || 0
  };
};

// Request size monitoring
export const requestSizeMonitoring = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / 1024 / 1024;
    
    if (sizeInMB > 10) {
      logPerformance('Large Request', sizeInMB, {
        method: req.method,
        url: req.originalUrl,
        size: `${sizeInMB.toFixed(2)}MB`
      });
    }
  }
  
  next();
};

// Connection monitoring
export const connectionMonitoring = () => {
  let activeConnections = 0;
  let totalConnections = 0;
  
  return {
    increment: () => {
      activeConnections++;
      totalConnections++;
    },
    decrement: () => {
      activeConnections--;
    },
    getStats: () => ({
      active: activeConnections,
      total: totalConnections
    }),
    logStats: () => {
      if (activeConnections > 100) {
        logPerformance('High Connection Count', activeConnections, {
          total: totalConnections
        });
      }
    }
  };
};
