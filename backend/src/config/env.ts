import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  
  // Database
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_TO_FILE: z.string().transform(val => val === 'true').default('true'),
  LOG_DIR: z.string().default('logs'),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
});

// Parse environment variables
type EnvVars = z.infer<typeof envSchema>;

let env: EnvVars;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    
    console.error('❌ Invalid environment variables:', JSON.stringify(errorMessages, null, 2));
    process.exit(1);
  }
  
  console.error('❌ Failed to parse environment variables:', error);
  process.exit(1);
}

// Export environment variables with type safety
export default env as EnvVars;

// Helper function to get environment variables in other files
// Example: const { NODE_ENV, PORT } = getEnv();
export function getEnv(): EnvVars {
  return env;
}

// Helper to check if running in production
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Helper to get CORS options
export function getCorsOptions() {
  return {
    origin: env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'X-Request-ID',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Response-Time',
    ],
  };
}

// Helper to get rate limit options
export function getRateLimitOptions() {
  return {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests, please try again later.',
  };
}
