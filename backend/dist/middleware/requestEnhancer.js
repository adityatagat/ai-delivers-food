"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const perf_hooks_1 = require("perf_hooks");
const logger_1 = require("../utils/logger");
/**
 * Enhances the request object with additional functionality
 */
const requestEnhancer = (req, res, next) => {
    try {
        // Always generate a new request ID to ensure it's always set
        req.requestId = (0, uuid_1.v4)();
        req.startTime = perf_hooks_1.performance.now();
        req.timestamp = new Date().toISOString();
        // Set request ID in response headers
        res.setHeader('X-Request-ID', req.requestId);
        res.setHeader('X-Request-Timestamp', req.timestamp);
        // Log request details
        logger_1.logger.http(`Request: ${req.method} ${req.originalUrl}`, {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            timestamp: req.timestamp,
        });
        // Add response time header
        res.on('finish', () => {
            const responseTime = perf_hooks_1.performance.now() - req.startTime;
            const responseTimeMs = parseFloat(responseTime.toFixed(2));
            // Only set headers if they haven't been sent yet
            if (!res.headersSent) {
                res.setHeader('X-Response-Time', `${responseTimeMs}ms`);
            }
            // Log response details
            logger_1.logger.http(`Response: ${req.method} ${req.originalUrl}`, {
                requestId: req.requestId,
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                responseTime: responseTimeMs,
                contentLength: res.get('content-length') || '0',
            });
        });
        // Add a simple success response helper
        res.success = function (data, statusCode = 200) {
            // Check if headers have already been sent
            if (this.headersSent) {
                logger_1.logger.warn('Headers already sent when trying to send success response', {
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
        res.error = function (message, statusCode = 400, errors) {
            logger_1.logger.warn(`Request error: ${message}`, {
                requestId: req.requestId,
                statusCode,
                errors,
                url: req.originalUrl,
                method: req.method,
            });
            // Check if headers have already been sent
            if (this.headersSent) {
                // If headers are already sent, log the error and end the response
                logger_1.logger.error('Headers already sent when trying to send error response', {
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
    }
    catch (error) {
        logger_1.logger.error('Error in request enhancer middleware', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            url: req.originalUrl,
            method: req.method,
        });
        next(error);
    }
};
// Export the enhanced request handler as default
exports.default = requestEnhancer;
