"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const path_1 = __importDefault(require("path"));
const swagger_1 = require("./config/swagger");
const db_1 = __importDefault(require("./db"));
const socketService_1 = __importDefault(require("./services/socketService"));
const foodItemRoutes_1 = __importDefault(require("./routes/foodItemRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const trackingRoutes_1 = __importDefault(require("./routes/trackingRoutes"));
const menuRoutes_1 = __importDefault(require("./routes/menuRoutes"));
const restaurantRoutes_1 = __importDefault(require("./routes/restaurantRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const security_1 = require("./middleware/security");
const requestLogger_1 = require("./middleware/requestLogger");
const requestEnhancer_1 = __importDefault(require("./middleware/requestEnhancer"));
const logger_1 = require("./utils/logger");
const processEvents_1 = __importDefault(require("./utils/processEvents"));
const env_1 = require("./config/env");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Initialize the Express application
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../../public')));
// Get environment configuration
const { PORT, NODE_ENV, FRONTEND_URL } = (0, env_1.getEnv)();
// Initialize process event handlers for uncaught exceptions and unhandled rejections
processEvents_1.default.handleExceptions();
processEvents_1.default.handleRejections();
// ========================
// 1. Security Middleware
// ========================
// Apply security headers (Helmet, CSP, etc.)
app.use(security_1.securityHeaders);
// Apply rate limiting to all requests
app.use(security_1.rateLimiter);
// Configure CORS with environment-specific settings
app.use(security_1.corsConfig);
// ========================
// 2. Request Processing
// ========================
// Parse JSON and URL-encoded bodies with size limits
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Trust first proxy (important for rate limiting behind reverse proxies)
app.set('trust proxy', 1);
// ========================
// 3. Request Enhancement
// ========================
// Enhance request object with additional functionality (request ID, timers, etc.)
app.use(requestEnhancer_1.default);
// Request logging middleware (must be after requestEnhancer)
app.use(requestLogger_1.requestLogger);
// ========================
// 4. API Documentation
// ========================
// Serve API documentation in non-production environments
if (NODE_ENV !== 'production') {
    // Add API documentation route
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.specs, {
        explorer: true,
        customSiteTitle: 'AI Delivers Food API',
        customCss: '.swagger-ui .topbar { display: none }',
        customfavIcon: '/favicon.ico',
    }));
    logger_1.logger.info(`Swagger UI available at /api-docs`);
}
// ========================
// 5. Health Check Endpoint
// ========================
app.get('/health', (_req, res) => {
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
app.use(`${API_PREFIX}/food-items`, foodItemRoutes_1.default);
app.use(`${API_PREFIX}/orders`, orderRoutes_1.default);
app.use(`${API_PREFIX}/auth`, authRoutes_1.default);
app.use(`${API_PREFIX}/tracking`, trackingRoutes_1.default);
app.use(`${API_PREFIX}/menu`, menuRoutes_1.default);
app.use(`${API_PREFIX}/restaurant`, restaurantRoutes_1.default);
// ========================
// 7. Error Handling
// ========================
// 404 handler - must be after all other routes
app.use(errorHandler_1.notFound);
// Global error handler - must be after all other middleware
app.use(errorHandler_1.errorHandler);
// ========================
// 8. WebSocket Initialization
// ========================
// Initialize WebSocket server
socketService_1.default.initialize(httpServer);
/**
 * Graceful shutdown handler
 */
const shutdown = async (server) => {
    const SHUTDOWN_TIMEOUT = 10000; // 10 seconds
    logger_1.logger.info('Starting graceful shutdown...');
    // Create a timeout to force shutdown if it takes too long
    const shutdownTimer = setTimeout(() => {
        logger_1.logger.error('Graceful shutdown timed out. Forcing exit...');
        process.exit(1);
    }, SHUTDOWN_TIMEOUT);
    try {
        // 1. Close the HTTP server
        logger_1.logger.info('Closing HTTP server...');
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err)
                    return reject(err);
                logger_1.logger.info('HTTP server closed');
                resolve();
            });
        });
        // 2. Close WebSocket connections
        logger_1.logger.info('Closing WebSocket connections...');
        await socketService_1.default.shutdown();
        // 3. Close database connections
        logger_1.logger.info('Closing database connections...');
        try {
            const mongoose = await (0, db_1.default)();
            if (mongoose && mongoose.connection) {
                await mongoose.connection.close();
                logger_1.logger.info('Database connection closed');
            }
        }
        catch (error) {
            logger_1.logger.error('Error closing database connection:', error);
            throw error;
        }
        // 4. Clear any intervals or timeouts
        logger_1.logger.info('Cleaning up resources...');
        clearTimeout(shutdownTimer);
        logger_1.logger.info('Graceful shutdown completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.logger.error('Error during shutdown:', error);
        process.exit(1);
    }
};
/**
 * Start the server
 */
const startServer = async () => {
    try {
        logger_1.logger.info('Starting server...');
        // 1. Connect to database
        logger_1.logger.info('Connecting to database...');
        await (0, db_1.default)();
        // Only start the HTTP server if not in test environment
        if (NODE_ENV !== 'test') {
            // 2. Start the HTTP server
            const server = httpServer.listen(PORT, () => {
                const address = server.address();
                let host;
                if (typeof address === 'string') {
                    host = address;
                }
                else if (address) {
                    const hostname = address.address === '::' ? 'localhost' : address.address;
                    host = `${hostname}:${address.port}`;
                }
                else {
                    host = `localhost:${PORT}`;
                }
                logger_1.logger.info(`Server running in ${NODE_ENV} mode`);
                logger_1.logger.info(`Server listening at http://${host}`);
                if (NODE_ENV !== 'production') {
                    logger_1.logger.info(`API Documentation available at http://${host}/api-docs`);
                    logger_1.logger.info(`Frontend URL: ${FRONTEND_URL || 'Not configured'}`);
                }
            });
            // 3. Handle server errors
            server.on('error', (error) => {
                if (error.syscall !== 'listen') {
                    throw error;
                }
                const bind = typeof PORT === 'string' ? `Pipe ${PORT}` : `Port ${PORT}`;
                // Handle specific listen errors with friendly messages
                switch (error.code) {
                    case 'EACCES':
                        logger_1.logger.error(`${bind} requires elevated privileges`);
                        process.exit(1);
                    case 'EADDRINUSE':
                        logger_1.logger.error(`${bind} is already in use`);
                        process.exit(1);
                    default:
                        throw error;
                }
            });
            // 4. Set up graceful shutdown handlers
            const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
            signals.forEach((signal) => {
                process.on(signal, () => {
                    logger_1.logger.info(`Received ${signal}. Starting graceful shutdown...`);
                    shutdown(server).catch((error) => {
                        logger_1.logger.error('Error during shutdown:', error);
                        process.exit(1);
                    });
                });
            });
            // 5. Handle uncaught exceptions and unhandled rejections
            process.on('uncaughtException', (error) => {
                logger_1.logger.error('Uncaught Exception:', error);
                // Don't exit immediately, give time for logging and cleanup
                setTimeout(() => process.exit(1), 1000);
            });
            process.on('unhandledRejection', (reason) => {
                logger_1.logger.error('Unhandled Rejection:', reason);
                // Don't exit immediately, give time for logging and cleanup
                setTimeout(() => process.exit(1), 1000);
            });
        }
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Only start the server if this file is run directly (not when imported for tests)
if (require.main === module) {
    startServer().catch((error) => {
        logger_1.logger.error('Fatal error during server startup:', error);
        process.exit(1);
    });
}
exports.default = app;
