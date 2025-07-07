import winston from 'winston';
import path from 'path';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response } from 'express';
import { TransformableInfo } from 'logform';

const { combine, timestamp, printf, colorize, json, metadata, errors } = winston.format;

// Define log formats
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
  
  // Add stack trace if it exists
  if (stack) {
    logMessage += `\n${stack}`;
  }
  
  // Add metadata if it exists
  const metaWithoutStack = { ...meta };
  delete metaWithoutStack.stack;
  
  if (Object.keys(metaWithoutStack).length > 0) {
    logMessage += `\n${JSON.stringify(metaWithoutStack, null, 2)}`;
  }
  
  return logMessage;
});

const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level: level.toUpperCase(),
    message,
    ...meta,
  });
});

// Create a stream for Morgan to use with Winston
const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Create a format for HTTP requests
const httpFormat = winston.format((info) => {
  const { req, res } = info.metadata as { req: Request; res: Response };
  
  if (req && res) {
    info.metadata = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: res.getHeader('x-response-time'),
      ip: req.ip || req.ips || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };
  }
  
  return info;
});

// Create transports
const transports = {
  console: new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      consoleFormat
    ),
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
  file: new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      metadata(),
      fileFormat
    ),
    level: 'info',
  }),
  errorFile: new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      metadata(),
      fileFormat
    ),
    level: 'error',
  }),
  httpFile: new DailyRotateFile({
    filename: path.join(__dirname, '../../logs/http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      httpFormat(),
      metadata(),
      fileFormat
    ),
    level: 'http',
  }),
};

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    winston.format.splat(),
    winston.format.metadata({
      fillExcept: ['message', 'level', 'timestamp', 'label'],
    })
  ),
  defaultMeta: { 
    service: 'ai-delivers-food',
    env: process.env.NODE_ENV || 'development',
  },
  transports: [
    transports.console,
    transports.file,
    transports.errorFile,
    transports.httpFile,
  ],
  exitOnError: false, // Don't exit on handled exceptions
});

// Add a stream for Morgan HTTP request logging
const morganStream = {
  write: (message: string) => {
    // Use the 'http' log level for Morgan messages
    logger.http(message.trim());
  },
};

// Create a child logger for HTTP requests
export const httpLogger = logger.child({ component: 'http' });

// Export the main logger as both default and named export
export { logger };
export default logger;
export { morganStream, stream };
