import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false,
});

// Create a stream object with a 'write' function for Morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.substring(0, message.lastIndexOf('\n')));
  },
};

// Custom logging functions
export const logError = (error: Error, context?: any) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info({
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn({
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
};

export const logHttp = (message: string, meta?: any) => {
  logger.http({
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug({
    message,
    meta,
    timestamp: new Date().toISOString(),
  });
};

// Performance logging
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info({
    message: `Performance: ${operation}`,
    duration: `${duration}ms`,
    meta,
    timestamp: new Date().toISOString(),
  });
};

// Security logging
export const logSecurity = (event: string, details: any) => {
  logger.warn({
    message: `Security Event: ${event}`,
    details,
    timestamp: new Date().toISOString(),
  });
};

// Database logging
export const logDatabase = (operation: string, query?: string, duration?: number) => {
  logger.debug({
    message: `Database: ${operation}`,
    query: query?.substring(0, 200), // Truncate long queries
    duration: duration ? `${duration}ms` : undefined,
    timestamp: new Date().toISOString(),
  });
};

// API logging
export const logAPI = (method: string, url: string, statusCode: number, duration: number, user?: string) => {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level]({
    message: `API ${method} ${url}`,
    statusCode,
    duration: `${duration}ms`,
    user,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
