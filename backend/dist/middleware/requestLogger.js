"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = void 0;
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
/**
 * Logs incoming requests and their responses with detailed information
 */
const requestLogger = (req, res, next) => {
    // Skip health checks in production
    if (req.path === '/health' && process.env.NODE_ENV === 'production') {
        return next();
    }
    const start = Date.now();
    const requestId = (0, uuid_1.v4)();
    const { method, originalUrl, ip, body, query, params, headers } = req;
    // Add request ID to request and response
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    // Log request details
    const requestLog = {
        requestId,
        method,
        url: originalUrl,
        path: req.path,
        ip: ip || req.connection.remoteAddress || req.socket.remoteAddress,
        userAgent: headers['user-agent'],
        timestamp: new Date().toISOString(),
    };
    // Add query params if they exist
    if (Object.keys(query).length > 0) {
        requestLog.query = query;
    }
    // Add route params if they exist
    if (Object.keys(params).length > 0) {
        requestLog.params = params;
    }
    // Add request body if it exists (excluding sensitive data)
    if (body && Object.keys(body).length > 0) {
        requestLog.body = redactSensitiveData(body);
    }
    // Log the request
    logger_1.httpLogger.info('Incoming Request', requestLog);
    // Store the original send function
    const originalSend = res.send;
    // Override the send function to log the response
    res.send = function (body) {
        const responseTime = Date.now() - start;
        // Create response log
        const responseLog = {
            requestId,
            method,
            url: originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
        };
        // Add error details for error responses
        if (res.statusCode >= 400) {
            responseLog.error = typeof body === 'string' ? body : JSON.stringify(body);
            logger_1.httpLogger.error('Error Response', responseLog);
        }
        else {
            logger_1.httpLogger.info('Outgoing Response', responseLog);
        }
        // Call the original send function
        return originalSend.call(this, body);
    };
    // Log when response is finished
    res.on('finish', () => {
        const responseTime = Date.now() - start;
        const finishLog = {
            requestId,
            method,
            url: originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            timestamp: new Date().toISOString(),
            contentLength: res.get('content-length'),
        };
        if (res.statusCode >= 400) {
            logger_1.httpLogger.error('Request Completed with Error', finishLog);
        }
        else {
            logger_1.httpLogger.debug('Request Completed Successfully', finishLog);
        }
    });
    next();
};
exports.requestLogger = requestLogger;
/**
 * Redacts sensitive information from request body
 */
function redactSensitiveData(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const sensitiveFields = [
        'password',
        'newPassword',
        'currentPassword',
        'confirmPassword',
        'token',
        'refreshToken',
        'accessToken',
        'authorization',
        'cardNumber',
        'cvv',
        'expiryDate',
        'apiKey',
        'secret',
        'privateKey',
        'creditCard',
        'ssn',
        'socialSecurityNumber',
    ];
    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => typeof item === 'object' ? redactSensitiveData(item) : item);
    }
    // Handle buffers and other non-plain objects
    if (obj.constructor !== Object && !(obj instanceof Date)) {
        return obj;
    }
    return Object.entries(obj).reduce((acc, [key, value]) => {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()));
        if (isSensitive) {
            acc[key] = '***REDACTED***';
        }
        else if (Array.isArray(value)) {
            acc[key] = value.map(item => typeof item === 'object' && item !== null ? redactSensitiveData(item) : item);
        }
        else if (value && typeof value === 'object' && !(value instanceof Date)) {
            acc[key] = redactSensitiveData(value);
        }
        else {
            acc[key] = value;
        }
        return acc;
    }, {});
}
