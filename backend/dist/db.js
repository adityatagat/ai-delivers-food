"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.disconnectDB = disconnectDB;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = require("./utils/logger");
// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGO_URI;
if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}
// Initialize the cached connection
let cached = global.mongoose || { conn: null, promise: null };
if (!global.mongoose) {
    global.mongoose = cached;
}
/**
 * Connect to MongoDB using the connection string from the environment variables.
 * Reuses existing connection if available.
 */
/**
 * Connect to MongoDB using the connection string from the environment variables.
 * Uses a cached connection if available to prevent multiple connections in development.
 */
async function connectDB() {
    if (cached.conn) {
        logger_1.logger.debug('Using existing database connection');
        return cached.conn;
    }
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000, // 45 seconds
            family: 4, // Use IPv4, skip trying IPv6
            maxPoolSize: 10, // Maintain up to 10 socket connections
            retryWrites: true,
            w: 'majority',
        };
        logger_1.logger.info('Connecting to MongoDB...');
        cached.promise = mongoose_1.default.connect(MONGODB_URI, opts);
    }
    try {
        // Wait for the connection promise to resolve
        cached.conn = await cached.promise;
        logger_1.logger.info('MongoDB connected successfully');
        return cached.conn;
    }
    catch (error) {
        logger_1.logger.error('MongoDB connection error:', error);
        // Reset the promise on error to allow retries
        cached.promise = null;
        throw error;
    }
}
/**
 * Close the MongoDB connection
 */
/**
 * Close the MongoDB connection and clear the cache.
 * This should be called when the application is shutting down.
 */
async function disconnectDB() {
    if (cached.conn) {
        try {
            logger_1.logger.info('Closing MongoDB connection...');
            await mongoose_1.default.disconnect();
            logger_1.logger.info('MongoDB connection closed');
        }
        catch (error) {
            logger_1.logger.error('Error closing MongoDB connection:', error);
            throw error;
        }
        finally {
            cached.conn = null;
            cached.promise = null;
        }
    }
}
// Handle application termination
process.on('SIGINT', async () => {
    await disconnectDB();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await disconnectDB();
    process.exit(0);
});
exports.default = connectDB;
