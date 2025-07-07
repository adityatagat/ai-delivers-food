import mongoose, { ConnectOptions } from 'mongoose';
import { logger } from './utils/logger';

// Type for our cached connection
interface CachedConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type with our custom properties
declare global {
  // eslint-disable-next-line no-var
  var mongoose: CachedConnection;
}

// Get MongoDB URI from environment variables
const MONGODB_URI = process.env.MONGO_URI as string;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
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
async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    logger.debug('Using existing database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10, // Maintain up to 10 socket connections
      retryWrites: true,
      w: 'majority',
    };

    logger.info('Connecting to MongoDB...');
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    // Wait for the connection promise to resolve
    cached.conn = await cached.promise;
    logger.info('MongoDB connected successfully');
    return cached.conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
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
async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    try {
      logger.info('Closing MongoDB connection...');
      await mongoose.disconnect();
      logger.info('MongoDB connection closed');
    } catch (error) {
      logger.error('Error closing MongoDB connection:', error);
      throw error;
    } finally {
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

export { connectDB, disconnectDB };
export default connectDB;