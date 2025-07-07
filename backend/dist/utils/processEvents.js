"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
class ProcessEvents {
    /**
     * Handle uncaught exceptions
     */
    handleExceptions() {
        process.on('uncaughtException', (error) => {
            logger_1.default.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
            // If we're not in production, exit immediately
            if (process.env.NODE_ENV !== 'production') {
                process.exit(1);
            }
            // In production, we might want to attempt a graceful shutdown
            // and let our process manager restart the application
        });
    }
    /**
     * Handle unhandled promise rejections
     */
    handleRejections() {
        process.on('unhandledRejection', (reason) => {
            logger_1.default.error('UNHANDLED REJECTION! 💥 Shutting down...', {
                name: reason === null || reason === void 0 ? void 0 : reason.name,
                message: reason === null || reason === void 0 ? void 0 : reason.message,
                stack: reason === null || reason === void 0 ? void 0 : reason.stack,
            });
            // In production, we might want to attempt a graceful shutdown
            if (process.env.NODE_ENV === 'production') {
                // Give the server time to finish any pending requests
                setTimeout(() => {
                    process.exit(1);
                }, 1000);
            }
        });
    }
    /**
     * Handle process termination signals
     */
    handleSignals(server) {
        // Handle termination signals
        const signals = ['SIGTERM', 'SIGINT'];
        signals.forEach(signal => {
            process.on(signal, () => {
                logger_1.default.info(`👋 ${signal} RECEIVED. Shutting down gracefully`);
                if (server) {
                    server.close(() => {
                        logger_1.default.info('💥 Process terminated!');
                        process.exit(0);
                    });
                }
                else {
                    process.exit(0);
                }
            });
        });
    }
}
exports.default = new ProcessEvents();
