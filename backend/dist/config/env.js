"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isTest = exports.isDevelopment = exports.isProduction = void 0;
exports.getEnv = getEnv;
exports.getCorsOptions = getCorsOptions;
exports.getRateLimitOptions = getRateLimitOptions;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Define the schema for environment variables
const envSchema = zod_1.z.object({
    // Server
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().default('5000'),
    // Database
    MONGO_URI: zod_1.z.string().min(1, 'MONGO_URI is required'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
    JWT_EXPIRES_IN: zod_1.z.string().default('1d'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    // CORS
    FRONTEND_URL: zod_1.z.string().url().default('http://localhost:3000'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(15 * 60 * 1000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.coerce.number().default(100),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    LOG_TO_FILE: zod_1.z.string().transform(val => val === 'true').default('true'),
    LOG_DIR: zod_1.z.string().default('logs'),
    // Email (optional)
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().optional(),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    EMAIL_FROM: zod_1.z.string().email().optional(),
});
let env;
try {
    env = envSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
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
exports.default = env;
// Helper function to get environment variables in other files
// Example: const { NODE_ENV, PORT } = getEnv();
function getEnv() {
    return env;
}
// Helper to check if running in production
exports.isProduction = env.NODE_ENV === 'production';
exports.isDevelopment = env.NODE_ENV === 'development';
exports.isTest = env.NODE_ENV === 'test';
// Helper to get CORS options
function getCorsOptions() {
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
function getRateLimitOptions() {
    return {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: true,
        legacyHeaders: false,
        message: 'Too many requests, please try again later.',
    };
}
