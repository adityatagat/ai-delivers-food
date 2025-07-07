import { Request, Response, NextFunction, RequestHandler as ExpressRequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';
import { logger } from '../utils/logger';

// Extend the Express Request type with our custom properties
declare global {
  namespace Express {
    interface Request {
      /**
       * Unique request identifier
       */
      requestId: string;
      
      /**
       * Request start time in milliseconds (high-resolution)
       */
      startTime: number;
      
      /**
       * Request timestamp in ISO format
       */
      timestamp: string;
      
      /**
       * User information (if authenticated)
       */
      user?: any; // Replace 'any' with your User type
    }
    
    interface Response {
      /**
       * Send a success response with data
       */
      success: <T>(data: T, statusCode?: number) => Response;
      
      /**
       * Send an error response
       */
      error: (message: string, statusCode?: number, errors?: any) => Response;
    }
  }
}

/**
 * Enhances the request object with additional functionality
 */
const requestEnhancer: ExpressRequestHandler = (req, res, next) => {
  try {
    // Always generate a new request ID to ensure it's always set
    req.requestId = uuidv4();
    req.startTime = performance.now();
    req.timestamp = new Date().toISOString();
    
    // Set request ID in response headers
    res.setHeader('X-Request-ID', req.requestId);
    res.setHeader('X-Request-Timestamp', req.timestamp);

    // Log request details
    logger.http(`Request: ${req.method} ${req.originalUrl}`, {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: req.timestamp,
    });

    // Add response time header
    res.on('finish', () => {
      const responseTime = performance.now() - req.startTime;
      const responseTimeMs = parseFloat(responseTime.toFixed(2));
      
      // Only set headers if they haven't been sent yet
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
      }
      
      // Log response details
      logger.http(`Response: ${req.method} ${req.originalUrl}`, {
        requestId: req.requestId,
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        responseTime: responseTimeMs,
        contentLength: res.get('content-length') || '0',
      });
    });

    // Add a simple success response helper
    res.success = function <T>(
      data: T, 
      statusCode = 200
    ): Response {
      // Check if headers have already been sent
      if (this.headersSent) {
        logger.warn('Headers already sent when trying to send success response', {
          requestId: req.requestId,
          url: req.originalUrl,
          method: req.method,
        });
        return this;
      }
      
      return this.status(statusCode).json({
        success: true,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        data,
      });
    };

    // Add a simple error response helper
    res.error = function (
      message: string, 
      statusCode = 400, 
      errors?: any
    ): Response {
      logger.warn(`Request error: ${message}`, {
        requestId: req.requestId,
        statusCode,
        errors,
        url: req.originalUrl,
        method: req.method,
      });
      
      // Check if headers have already been sent
      if (this.headersSent) {
        // If headers are already sent, log the error and end the response
        logger.error('Headers already sent when trying to send error response', {
          requestId: req.requestId,
          url: req.originalUrl,
          method: req.method,
          statusCode,
          message,
        });
        return this;
      }
      
      return this.status(statusCode).json({
        success: false,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        error: {
          message,
          code: statusCode,
          ...(errors && { details: errors }),
        },
      });
    };

    next();
  } catch (error) {
    logger.error('Error in request enhancer middleware', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      url: req.originalUrl,
      method: req.method,
    });
    next(error);
  }
};

// Export the enhanced request handler as default
export default requestEnhancer;
