"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
class SocketService {
    constructor() {
        this.io = null;
        this.listeners = new Map();
    }
    initialize(server) {
        try {
            this.io = new socket_io_1.Server(server, {
                cors: {
                    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                    methods: ['GET', 'POST']
                }
            });
            this.io.on('connection', (socket) => {
                console.log('Client connected:', socket.id);
                socket.on('disconnect', () => {
                    console.log('Client disconnected:', socket.id);
                });
            });
        }
        catch (error) {
            console.error('Failed to initialize socket service:', error);
            throw new Error('Socket service initialization failed');
        }
    }
    emitTrackingUpdate(orderId, trackingInfo) {
        try {
            if (!this.io) {
                throw new Error('Socket service not initialized');
            }
            this.io.emit(`tracking:${orderId}`, trackingInfo);
        }
        catch (error) {
            console.error('Failed to emit tracking update:', error);
            throw new Error('Failed to emit tracking update');
        }
    }
    emitOrderStatusUpdate(orderId, status) {
        try {
            if (!this.io) {
                throw new Error('Socket service not initialized');
            }
            this.io.emit(`order:${orderId}`, status);
        }
        catch (error) {
            console.error('Failed to emit order status update:', error);
            throw new Error('Failed to emit order status update');
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
exports.default = new SocketService();
