"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsConfig = exports.rateLimiter = exports.securityHeaders = void 0;
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
// Get rate limit configuration
const rateLimitConfig = (0, env_1.getRateLimitOptions)();
/**
 * Security middleware to set various HTTP headers
 */
exports.securityHeaders = [
    // Helmet security headers
    (0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "'unsafe-eval'"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    'https://fonts.googleapis.com',
                ],
                imgSrc: [
                    "'self'",
                    'data:',
                    'blob:',
                    'https://*.tile.openstreetmap.org',
                    'https://*.googleapis.com',
                    'https://*.gstatic.com',
                ],
                fontSrc: [
                    "'self'",
                    'data:',
                    'https://fonts.gstatic.com',
                ],
                connectSrc: [
                    "'self'",
                    'https://*.tile.openstreetmap.org',
                    'https://*.googleapis.com',
                    'https://*.gstatic.com',
                    'ws://localhost:*', // For WebSocket in development
                ],
                frameSrc: [
                    "'self'",
                    'https://www.google.com',
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
    // HTTP Strict Transport Security
    helmet_1.default.hsts({
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true,
    }),
    // XSS Filter
    helmet_1.default.xssFilter(),
    // Prevent clickjacking
    helmet_1.default.frameguard({ action: 'deny' }),
    // Prevent MIME type sniffing
    helmet_1.default.noSniff(),
    // Remove X-Powered-By header
    helmet_1.default.hidePoweredBy(),
    // Set X-Content-Type-Options
    (req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        next();
    },
];
/**
 * Rate limiting middleware to prevent abuse
 */
exports.rateLimiter = (0, express_rate_limit_1.default)({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.max,
    standardHeaders: rateLimitConfig.standardHeaders,
    legacyHeaders: rateLimitConfig.legacyHeaders,
    message: rateLimitConfig.message,
    keyGenerator: (req) => {
        var _a;
        // Use the client's IP address and user ID (if authenticated) as the key
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'anonymous';
        return `${req.ip}:${userId}`;
    },
    skip: (req) => {
        // Skip rate limiting for health checks and in test environment
        if (process.env.NODE_ENV === 'test' || req.path === '/health') {
            return true;
        }
        return false;
    },
});
/**
 * CORS configuration middleware
 */
const corsConfig = (req, res, next) => {
    const corsOptions = (0, env_1.getCorsOptions)();
    // Set CORS headers
    if (corsOptions.origin) {
        res.setHeader('Access-Control-Allow-Origin', corsOptions.origin);
    }
    if (corsOptions.methods) {
        res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    }
    if (corsOptions.allowedHeaders) {
        res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    }
    if (corsOptions.exposedHeaders) {
        res.setHeader('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(','));
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
};
exports.corsConfig = corsConfig;
