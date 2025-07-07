import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { getRateLimitOptions, getCorsOptions } from '../config/env';

// Get rate limit configuration
const rateLimitConfig = getRateLimitOptions();

/**
 * Security middleware to set various HTTP headers
 */
export const securityHeaders = [
  // Helmet security headers
  helmet({
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
  helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  }),
  
  // XSS Filter
  helmet.xssFilter(),
  
  // Prevent clickjacking
  helmet.frameguard({ action: 'deny' }),
  
  // Prevent MIME type sniffing
  helmet.noSniff(),
  
  // Remove X-Powered-By header
  helmet.hidePoweredBy(),
  
  // Set X-Content-Type-Options
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  },
];

/**
 * Rate limiting middleware to prevent abuse
 */
export const rateLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.max,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
  message: rateLimitConfig.message,
  keyGenerator: (req) => {
    // Use the client's IP address and user ID (if authenticated) as the key
    const userId = req.user?.id || 'anonymous';
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
export const corsConfig = (req: Request, res: Response, next: NextFunction) => {
  const corsOptions = getCorsOptions();
  
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
