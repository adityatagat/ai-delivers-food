"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = void 0;
const socket_io_1 = require("socket.io");
const logger_1 = require("../utils/logger");
class SocketService {
    constructor() {
        this.io = null;
        this.listeners = new Map();
        this.connectedClients = new Map();
        this.isInitialized = false;
    }
    /**
     * Initialize the Socket.IO server
     * @param server HTTP server instance
     */
    initialize(server) {
        if (this.isInitialized) {
            logger_1.logger.warn('SocketService is already initialized');
            return;
        }
        try {
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: process.env.NODE_ENV === 'production'
                        ? process.env.FRONTEND_URL
                        : 'http://localhost:3000',
                    methods: ['GET', 'POST'],
                    credentials: true
                },
                path: '/socket.io',
                serveClient: false,
                pingInterval: 10000,
                pingTimeout: 5000,
                cookie: false,
            });
            // Handle new connections
            this.io.on('connection', (socket) => {
                const clientId = socket.id;
                this.connectedClients.set(clientId, socket);
                logger_1.logger.info(`Client connected: ${clientId}`, {
                    clientId,
                    handshake: socket.handshake,
                    connectedClients: this.connectedClients.size,
                });
                // Handle disconnection
                socket.on('disconnect', (reason) => {
                    this.connectedClients.delete(clientId);
                    logger_1.logger.info(`Client disconnected: ${clientId}`, {
                        reason,
                        connectedClients: this.connectedClients.size,
                    });
                });
                // Handle errors
                socket.on('error', (error) => {
                    logger_1.logger.error(`Socket error (${clientId}):`, error);
                });
            });
            // Handle server errors
            this.io.engine.on('connection_error', (error) => {
                logger_1.logger.error('Socket connection error:', error);
            });
            this.isInitialized = true;
            logger_1.logger.info('SocketService initialized successfully');
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            logger_1.logger.error('Failed to initialize SocketService:', error);
            throw new Error(`Socket service initialization failed: ${errorMessage}`);
        }
    }
    /**
     * Emit tracking update to all connected clients
     * @param orderId Order ID
     * @param trackingInfo Tracking information
     */
    emitTrackingUpdate(orderId, trackingInfo) {
        if (!this.io || !this.isInitialized) {
            throw new Error('Socket service not initialized');
        }
        try {
            const eventName = `tracking:${orderId}`;
            this.io.emit(eventName, trackingInfo);
            logger_1.logger.debug(`Emitted tracking update for order ${orderId}`, {
                orderId,
                event: eventName,
                trackingInfo,
                recipientCount: this.connectedClients.size,
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to emit tracking update for order ${orderId}:`, error);
            throw new Error(`Failed to emit tracking update: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Emit order status update to all connected clients
     * @param orderId Order ID
     * @param status New order status
     */
    emitOrderStatusUpdate(orderId, status) {
        if (!this.io || !this.isInitialized) {
            throw new Error('Socket service not initialized');
        }
        try {
            const eventName = `order:${orderId}:status`;
            this.io.emit(eventName, { orderId, status, timestamp: new Date() });
            logger_1.logger.debug(`Emitted status update for order ${orderId}`, {
                orderId,
                status,
                event: eventName,
                recipientCount: this.connectedClients.size,
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to emit status update for order ${orderId}:`, error);
            throw new Error(`Failed to emit order status update: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get the number of connected clients
     */
    getConnectedClientsCount() {
        return this.connectedClients.size;
    }
    /**
     * Gracefully shut down the socket server
     */
    async shutdown() {
        if (!this.io || !this.isInitialized) {
            logger_1.logger.warn('SocketService is not initialized, nothing to shut down');
            return;
        }
        try {
            logger_1.logger.info('Shutting down SocketService...', {
                connectedClients: this.connectedClients.size,
            });
            // Disconnect all clients
            this.io.sockets.sockets.forEach((socket) => {
                socket.disconnect(true);
            });
            // Close the server
            await new Promise((resolve, reject) => {
                if (!this.io) {
                    resolve();
                    return;
                }
                this.io.close((error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            // Clear collections
            this.connectedClients.clear();
            this.listeners.clear();
            this.isInitialized = false;
            this.io = null;
            logger_1.logger.info('SocketService shut down successfully');
        }
        catch (error) {
            logger_1.logger.error('Error during SocketService shutdown:', error);
            throw new Error(`Failed to shut down socket service: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    subscribeToOrder(orderId, callback) {
        try {
            if (!this.io) {
                throw new Error('Socket service not initialized');
            }
            const eventName = `tracking:${orderId}`;
            this.listeners.set(eventName, callback);
            this.io.on(eventName, callback);
        }
        catch (error) {
            console.error('Failed to subscribe to order updates:', error);
            throw new Error('Failed to subscribe to order updates');
        }
    }
    unsubscribeFromOrder(orderId) {
        try {
            if (!this.io) {
                throw new Error('Socket service not initialized');
            }
            const eventName = `tracking:${orderId}`;
            const listener = this.listeners.get(eventName);
            if (listener) {
                this.io.off(eventName, listener);
                this.listeners.delete(eventName);
            }
        }
        catch (error) {
            console.error('Failed to unsubscribe from order updates:', error);
            throw new Error('Failed to unsubscribe from order updates');
        }
    }
}
// Create a singleton instance
exports.socketService = new SocketService();
exports.default = exports.socketService;
