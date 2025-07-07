import logger from './logger';

class ProcessEvents {
  /**
   * Handle uncaught exceptions
   */
  public handleExceptions(): void {
    process.on('uncaughtException', (error: Error) => {
      logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', error);
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
  public handleRejections(): void {
    process.on('unhandledRejection', (reason: Error | any) => {
      logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
        name: reason?.name,
        message: reason?.message,
        stack: reason?.stack,
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
  public handleSignals(server?: any): void {
    // Handle termination signals
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
    
    signals.forEach(signal => {
      process.on(signal, () => {
        logger.info(`👋 ${signal} RECEIVED. Shutting down gracefully`);
        
        if (server) {
          server.close(() => {
            logger.info('💥 Process terminated!');
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });
  }
}

export default new ProcessEvents();
