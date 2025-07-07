"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncRouteHandler = exports.asyncHandler = exports.notFound = exports.errorHandler = exports.Errors = exports.ApiError = exports.errorTypeToStatusCode = void 0;
const logger_1 = require("../utils/logger");
const env_1 = require("../config/env");
// Error code to status code mapping
exports.errorTypeToStatusCode = {
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
class ApiError extends Error {
    constructor(errorType, message, details, isOperational = true, stack = '') {
        super(message);
        this.statusCode = exports.errorTypeToStatusCode[errorType] || 500;
        this.errorType = errorType;
        this.isOperational = isOperational;
        this.details = details;
        this.timestamp = new Date().toISOString();
        if (stack) {
            this.stack = stack;
        }
        else if (errorType !== 'INTERNAL_ERROR') {
            // Don't include stack trace for operational errors in production
            Error.captureStackTrace(this, this.constructor);
        }
    }
    /**
     * Convert the error to a plain object for JSON responses
     */
    toJSON() {
        return {
            success: false,
            error: {
                type: this.errorType,
                message: this.message,
                code: this.statusCode,
                details: this.details,
                stack: !env_1.isProduction ? this.stack : undefined,
                timestamp: this.timestamp,
            },
        };
    }
}
exports.ApiError = ApiError;
// Common error constructors
exports.Errors = {
    ValidationError: (message, details) => new ApiError('VALIDATION_ERROR', message, details),
    Unauthorized: (message = 'Not authenticated') => new ApiError('AUTH_ERROR', message),
    Forbidden: (message = 'Access denied') => new ApiError('FORBIDDEN', message),
    NotFound: (resource = 'Resource') => new ApiError('NOT_FOUND', `${resource} not found`),
    BadRequest: (message = 'Bad request', details) => new ApiError('BAD_REQUEST', message, details),
    RateLimit: (message = 'Too many requests') => new ApiError('RATE_LIMIT', message),
    InternalServerError: (error) => new ApiError('INTERNAL_ERROR', 'An unexpected error occurred', undefined, false, error === null || error === void 0 ? void 0 : error.stack)
};
// Error handler middleware
const errorHandler = (err, req, res, _next) => {
    var _a;
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
            user: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous',
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
        logger_1.logger.error('Server Error', errorContext);
    }
    else if (error.statusCode >= 400) {
        logger_1.logger.warn('Client Error', errorContext);
    }
    else {
        logger_1.logger.info('Application Error', errorContext);
    }
    // Handle specific error types
    if (err.name === 'ValidationError') {
        const message = 'Validation failed';
        const details = Object.values(err.errors).map((e) => ({
            field: e.path,
            message: e.message,
            value: e.value,
        }));
        error = new ApiError('VALIDATION_ERROR', message, details);
    }
    else if (err.name === 'JsonWebTokenError') {
        error = new ApiError('AUTH_ERROR', 'Invalid or missing authentication token');
    }
    else if (err.name === 'TokenExpiredError') {
        error = new ApiError('AUTH_ERROR', 'Authentication token has expired');
    }
    else if (err.name === 'MongoError') {
        if (err.code === 11000) {
            // Handle duplicate key errors
            const field = Object.keys(err.keyValue || {})[0] || 'field';
            const value = err.keyValue ? err.keyValue[field] : 'value';
            error = new ApiError('VALIDATION_ERROR', `${field} '${value}' already exists`, {
                field,
                value,
                code: 'DUPLICATE_KEY',
            });
        }
        else {
            // Handle other MongoDB errors
            error = new ApiError('INTERNAL_ERROR', 'Database operation failed', {
                code: err.code,
                message: err.message,
            });
        }
    }
    else if (err.name === 'CastError') {
        // Handle invalid ObjectId and other cast errors
        error = new ApiError('BAD_REQUEST', `Invalid ${err.path}: ${err.value}`);
    }
    else if (err.name === 'MongooseError') {
        // Handle other Mongoose errors
        error = new ApiError('BAD_REQUEST', 'Database validation failed', {
            message: err.message,
        });
    }
    else if (err.name === 'RequestTimeoutError') {
        error = new ApiError('TIMEOUT', 'Request timeout');
    }
    else if (err.name === 'ServiceUnavailableError') {
        error = new ApiError('SERVICE_UNAVAILABLE', 'Service temporarily unavailable');
    }
    else if (!(err instanceof ApiError)) {
        // Handle unhandled errors
        error = new ApiError('INTERNAL_ERROR', 'An unexpected error occurred', env_1.isProduction ? undefined : { stack: err.stack }, false);
    }
    // Prepare the error response
    const response = error instanceof ApiError
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
                type: 'INTERNAL_ERROR',
                message: 'An unexpected error occurred',
                code: 500,
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                ...(!env_1.isProduction && { stack: error.stack }),
            },
        };
    // Set response status and send error
    res.status(error.statusCode || 500).json(response);
};
exports.errorHandler = errorHandler;
// 404 handler
const notFound = (req, _res, next) => {
    const error = new ApiError('NOT_FOUND', `The requested resource ${req.originalUrl} was not found`, {
        method: req.method,
        path: req.path,
        params: req.params,
    });
    next(error);
};
exports.notFound = notFound;
// Async handler wrapper to catch async/await errors
const asyncHandler = (fn) => {
    return async (...args) => {
        const next = args[args.length - 1];
        try {
            await fn(...args);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.asyncHandler = asyncHandler;
const asyncRouteHandler = (handler) => {
    return async (req, res, next) => {
        try {
            await handler(req, res, next);
        }
        catch (error) {
            next(error);
        }
    };
};
exports.asyncRouteHandler = asyncRouteHandler;
