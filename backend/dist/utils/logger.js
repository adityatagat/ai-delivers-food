"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stream = exports.morganStream = exports.logger = exports.httpLogger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const { combine, timestamp, printf, colorize, json, metadata, errors } = winston_1.default.format;
// Define log formats
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    // Add stack trace if it exists
    if (stack) {
        logMessage += `\n${stack}`;
    }
    // Add metadata if it exists
    const metaWithoutStack = { ...meta };
    delete metaWithoutStack.stack;
    if (Object.keys(metaWithoutStack).length > 0) {
        logMessage += `\n${JSON.stringify(metaWithoutStack, null, 2)}`;
    }
    return logMessage;
});
const fileFormat = printf(({ level, message, timestamp, ...meta }) => {
    return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta,
    });
});
// Create a stream for Morgan to use with Winston
const stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
exports.stream = stream;
// Create a format for HTTP requests
const httpFormat = winston_1.default.format((info) => {
    const { req, res } = info.metadata;
    if (req && res) {
        info.metadata = {
            method: req.method,
            url: req.originalUrl || req.url,
            status: res.statusCode,
            responseTime: res.getHeader('x-response-time'),
            ip: req.ip || req.ips || req.connection.remoteAddress,
            userAgent: req.headers['user-agent'],
        };
    }
    return info;
});
// Create transports
const transports = {
    console: new winston_1.default.transports.Console({
        format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), consoleFormat),
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    }),
    file: new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(__dirname, '../../logs/application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), metadata(), fileFormat),
        level: 'info',
    }),
    errorFile: new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(__dirname, '../../logs/error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), metadata(), fileFormat),
        level: 'error',
    }),
    httpFile: new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(__dirname, '../../logs/http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), httpFormat(), metadata(), fileFormat),
        level: 'http',
    }),
};
// Create logger instance
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label'],
    })),
    defaultMeta: {
        service: 'ai-delivers-food',
        env: process.env.NODE_ENV || 'development',
    },
    transports: [
        transports.console,
        transports.file,
        transports.errorFile,
        transports.httpFile,
    ],
    exitOnError: false, // Don't exit on handled exceptions
});
exports.logger = logger;
// Add a stream for Morgan HTTP request logging
const morganStream = {
    write: (message) => {
        // Use the 'http' log level for Morgan messages
        logger.http(message.trim());
    },
};
exports.morganStream = morganStream;
// Create a child logger for HTTP requests
exports.httpLogger = logger.child({ component: 'http' });
exports.default = logger;
