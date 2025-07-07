import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { specs } from './config/swagger';
import connectDB from './db';
import socketService from './services/socketService';
import foodItemRoutes from './routes/foodItemRoutes';
import orderRoutes from './routes/orderRoutes';
import authRoutes from './routes/authRoutes';
import trackingRoutes from './routes/trackingRoutes';
import menuRoutes from './routes/menuRoutes';
import restaurantRoutes from './routes/restaurantRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';
import { securityHeaders, rateLimiter, corsConfig } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import requestEnhancer from './middleware/requestEnhancer';
import { logger } from './utils/logger';
import processEvents from './utils/processEvents';
import { getEnv } from './config/env';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize the Express application
const app = express();
const httpServer = createServer(app);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../../public')));

// Get environment configuration
const { PORT, NODE_ENV, FRONTEND_URL } = getEnv();

// Initialize process event handlers for uncaught exceptions and unhandled rejections
processEvents.handleExceptions();
processEvents.handleRejections();

// ========================
// 1. Security Middleware
// ========================

// Apply security headers (Helmet, CSP, etc.)
app.use(securityHeaders);

// Apply rate limiting to all requests
app.use(rateLimiter);

// Configure CORS with environment-specific settings
app.use(corsConfig);

// ========================
// 2. Request Processing
// ========================

// Parse JSON and URL-encoded bodies with size limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Trust first proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);

// ========================
// 3. Request Enhancement
// ========================

// Enhance request object with additional functionality (request ID, timers, etc.)
app.use(requestEnhancer);

// Request logging middleware (must be after requestEnhancer)
app.use(requestLogger);

// ========================
// 4. API Documentation
// ========================

// Serve API documentation in non-production environments
if (NODE_ENV !== 'production') {
  // Add API documentation route
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      customSiteTitle: 'AI Delivers Food API',
      customCss: '.swagger-ui .topbar { display: none }',
      customfavIcon: '/favicon.ico',
    })
  );
  
  logger.info(`Swagger UI available at /api-docs`);
}

// ========================
// 5. Health Check Endpoint
// ========================

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: NODE_ENV,
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  });
});

// ========================
// 6. API Routes
// ========================

// API routes with versioning
const API_PREFIX = '/api/v1';

// Mount API routes
app.use(`${API_PREFIX}/food-items`, foodItemRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/tracking`, trackingRoutes);
app.use(`${API_PREFIX}/menu`, menuRoutes);
app.use(`${API_PREFIX}/restaurant`, restaurantRoutes);

// ========================
// 7. Error Handling
// ========================

// 404 handler - must be after all other routes
app.use(notFound);

// Global error handler - must be after all other middleware
app.use(errorHandler);

// ========================
// 8. WebSocket Initialization
// ========================

// Initialize WebSocket server
socketService.initialize(httpServer);

/**
 * Graceful shutdown handler
 */
const shutdown = async (server: ReturnType<typeof httpServer.listen>): Promise<void> => {
  const SHUTDOWN_TIMEOUT = 10000; // 10 seconds
  
  logger.info('Starting graceful shutdown...');
  
  // Create a timeout to force shutdown if it takes too long
  const shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit...');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  
  try {
    // 1. Close the HTTP server
    logger.info('Closing HTTP server...');
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) return reject(err);
        logger.info('HTTP server closed');
        resolve();
      });
    });
    
    // 2. Close WebSocket connections
    logger.info('Closing WebSocket connections...');
    await socketService.shutdown();
    
    // 3. Close database connections
    logger.info('Closing database connections...');
    try {
      const mongoose = await connectDB();
      if (mongoose && mongoose.connection) {
        await mongoose.connection.close();
        logger.info('Database connection closed');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
    
    // 4. Clear any intervals or timeouts
    logger.info('Cleaning up resources...');
    clearTimeout(shutdownTimer);
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

/**
 * Start the server
 */
const startServer = async (): Promise<void> => {
  try {
    logger.info('Starting server...');
    
    // 1. Connect to database
    logger.info('Connecting to database...');
    await connectDB();
    
    // Only start the HTTP server if not in test environment
    if (NODE_ENV !== 'test') {
      // 2. Start the HTTP server
      const server = httpServer.listen(PORT, () => {
        const address = server.address();
        let host: string;
        
        if (typeof address === 'string') {
          host = address;
        } else if (address) {
          const hostname = address.address === '::' ? 'localhost' : address.address;
          host = `${hostname}:${address.port}`;
        } else {
          host = `localhost:${PORT}`;
        }
        
        logger.info(`Server running in ${NODE_ENV} mode`);
        logger.info(`Server listening at http://${host}`);
        
        if (NODE_ENV !== 'production') {
          logger.info(`API Documentation available at http://${host}/api-docs`);
          logger.info(`Frontend URL: ${FRONTEND_URL || 'Not configured'}`);
        }
      });

      // 3. Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.syscall !== 'listen') {
          throw error;
        }

        const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;

        // Handle specific listen errors with friendly messages
        switch (error.code) {
          case 'EACCES':
            logger.error(`${bind} requires elevated privileges`);
            process.exit(1);
          case 'EADDRINUSE':
            logger.error(`${bind} is already in use`);
            process.exit(1);
          default:
            throw error;
        }
      });

      // 4. Set up graceful shutdown handlers
      const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
      signals.forEach((signal) => {
        process.on(signal, () => {
          logger.info(`Received ${signal}. Starting graceful shutdown...`);
          shutdown(server).catch((error) => {
            logger.error('Error during shutdown:', error);
            process.exit(1);
          });
        });
      });
      
      // 5. Handle uncaught exceptions and unhandled rejections
      process.on('uncaughtException', (error: Error) => {
        logger.error('Uncaught Exception:', error);
        // Don't exit immediately, give time for logging and cleanup
        setTimeout(() => process.exit(1), 1000);
      });
      
      process.on('unhandledRejection', (reason: unknown) => {
        logger.error('Unhandled Rejection:', reason);
        // Don't exit immediately, give time for logging and cleanup
        setTimeout(() => process.exit(1), 1000);
      });
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Only start the server if this file is run directly (not when imported for tests)
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Fatal error during server startup:', error);
    process.exit(1);
  });
}

// Export the Express app for testing
export { app, httpServer };

export default app;