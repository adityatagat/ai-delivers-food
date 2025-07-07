import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger';
import { isProduction } from '../config/env';

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: any; // Define your user type here
    }
  }
}

// Error types
export type ErrorType = 
  | 'VALIDATION_ERROR' 
  | 'AUTH_ERROR' 
  | 'NOT_FOUND' 
  | 'INTERNAL_ERROR' 
  | 'FORBIDDEN' 
  | 'RATE_LIMIT' 
  | 'BAD_REQUEST'
  | 'SERVICE_UNAVAILABLE'
  | 'NOT_IMPLEMENTED'
  | 'TIMEOUT';

// Error code to status code mapping
export const errorTypeToStatusCode: Record<ErrorType, number> = {
  VALIDATION_ERROR: 400,
  AUTH_ERROR: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  RATE_LIMIT: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  NOT_IMPLEMENTED: 501,
  TIMEOUT: 504,
};

// Standard error response interface
export interface ErrorResponse {
  success: boolean;
  error: {
    type: ErrorType;
    message: string;
    code: number;
    details?: any;
    stack?: string;
    requestId?: string;
    timestamp: string;
  };
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorType: ErrorType;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    errorType: ErrorType,
    message: string,
    details?: any,
    isOperational = true,
    stack = ''
  ) {
    super(message);
    this.statusCode = errorTypeToStatusCode[errorType] || 500;
    this.errorType = errorType;
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    if (stack) {
      this.stack = stack;
    } else if (errorType !== 'INTERNAL_ERROR') {
      // Don't include stack trace for operational errors in production
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert the error to a plain object for JSON responses
   */
  public toJSON(): ErrorResponse {
    return {
      success: false,
      error: {
        type: this.errorType,
        message: this.message,
        code: this.statusCode,
        details: this.details,
        stack: !isProduction ? this.stack : undefined,
        timestamp: this.timestamp,
      },
    };
  }
}

// Common error constructors
export const Errors = {
  ValidationError: (message: string, details?: any) => 
    new ApiError('VALIDATION_ERROR', message, details),
  
  Unauthorized: (message = 'Not authenticated') => 
    new ApiError('AUTH_ERROR', message),
    
  Forbidden: (message = 'Access denied') => 
    new ApiError('FORBIDDEN', message),
    
  NotFound: (resource = 'Resource') => 
    new ApiError('NOT_FOUND', `${resource} not found`),
    
  BadRequest: (message = 'Bad request', details?: any) => 
    new ApiError('BAD_REQUEST', message, details),
    
  RateLimit: (message = 'Too many requests') => 
    new ApiError('RATE_LIMIT', message),
    
  InternalServerError: (error?: Error) => 
    new ApiError(
      'INTERNAL_ERROR', 
      'An unexpected error occurred', 
      undefined, 
      false,
      error?.stack
    )
};

// Error handler middleware
export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Prepare error context for logging
  const errorContext = {
    request: {
      id: req.requestId,
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      ip: req.ip,
      user: req.user?.id || 'anonymous',
      userAgent: req.get('user-agent'),
    },
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
      errorType: err.errorType,
      details: err.details,
    },
  };

  // Log the error with appropriate level
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorContext);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorContext);
  } else {
    logger.info('Application Error', errorContext);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    const message = 'Validation failed';
    const details = Object.values(err.errors).map((e: any) => ({
      field: e.path,
      message: e.message,
      value: e.value,
    }));
    error = new ApiError('VALIDATION_ERROR', message, details);
  } else if (err.name === 'JsonWebTokenError') {
    error = new ApiError('AUTH_ERROR', 'Invalid or missing authentication token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError('AUTH_ERROR', 'Authentication token has expired');
  } else if (err.name === 'MongoError') {
    if (err.code === 11000) {
      // Handle duplicate key errors
      const field = Object.keys(err.keyValue || {})[0] || 'field';
      const value = err.keyValue ? err.keyValue[field] : 'value';
      error = new ApiError('VALIDATION_ERROR', `${field} '${value}' already exists`, { 
        field, 
        value,
        code: 'DUPLICATE_KEY',
      });
    } else {
      // Handle other MongoDB errors
      error = new ApiError('INTERNAL_ERROR', 'Database operation failed', {
        code: err.code,
        message: err.message,
      });
    }
  } else if (err.name === 'CastError') {
    // Handle invalid ObjectId and other cast errors
    error = new ApiError('BAD_REQUEST', `Invalid ${err.path}: ${err.value}`);
  } else if (err.name === 'MongooseError') {
    // Handle other Mongoose errors
    error = new ApiError('BAD_REQUEST', 'Database validation failed', {
      message: err.message,
    });
  } else if (err.name === 'RequestTimeoutError') {
    error = new ApiError('TIMEOUT', 'Request timeout');
  } else if (err.name === 'ServiceUnavailableError') {
    error = new ApiError('SERVICE_UNAVAILABLE', 'Service temporarily unavailable');
  } else if (!(err instanceof ApiError)) {
    // Handle unhandled errors
    error = new ApiError(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      isProduction ? undefined : { stack: err.stack },
      false
    );
  }

  // Prepare the error response
  const response: ErrorResponse = error instanceof ApiError 
    ? {
        ...error.toJSON(),
        error: {
          ...error.toJSON().error,
          requestId: req.requestId,
        },
      }
    : {
        success: false,
        error: {
          type: 'INTERNAL_ERROR' as ErrorType,
          message: 'An unexpected error occurred',
          code: 500,
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
          ...(!isProduction && { stack: error.stack }),
        },
      };

  // Set response status and send error
  res.status(error.statusCode || 500).json(response);
};

// 404 handler
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(
    'NOT_FOUND', 
    `The requested resource ${req.originalUrl} was not found`,
    {
      method: req.method,
      path: req.path,
      params: req.params,
    }
  );
  next(error);
};

// Async handler wrapper to catch async/await errors
export const asyncHandler = <T extends (...args: any[]) => any>(
  fn: T
): ((...args: Parameters<T>) => Promise<void> | void) => {
  return async (...args: Parameters<T>) => {
    const next = args[args.length - 1] as NextFunction;
    try {
      await fn(...args);
    } catch (error) {
      next(error);
    }
  };
};

// Type-safe async handler for Express routes
type AsyncRequestHandler<ReqBody = any, ResBody = any, Params = any, Query = any> = (
  req: Request<Params, ResBody, ReqBody, Query>,
  res: Response<ResBody>,
  next: NextFunction
) => Promise<void> | void;

export const asyncRouteHandler = <
  ReqBody = any,
  ResBody = any,
  Params = any,
  Query = any
>(
  handler: AsyncRequestHandler<ReqBody, ResBody, Params, Query>
) => {
  return async (
    req: Request<Params, ResBody, ReqBody, Query>,
    res: Response<ResBody>,
    next: NextFunction
  ) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
