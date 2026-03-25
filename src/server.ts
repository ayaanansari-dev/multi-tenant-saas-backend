// src/server.ts
import { createApp } from './app';
import { env } from './config/env';
import { Logger } from './config/logger';
import { prisma } from './config/database';
import { closeRedis } from './config/redis';
import http from 'http';

let server: http.Server | null = null;

/**
 * Gracefully shutdown the server
 */
const gracefulShutdown = async (signal: string) => {
  Logger.info(`${signal} received. Starting graceful shutdown...`);
  
  if (!server) {
    Logger.warn('No server instance found, exiting...');
    process.exit(0);
  }

  // Set timeout for forced shutdown
  const shutdownTimeout = setTimeout(() => {
    Logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000); // 10 seconds timeout

  try {
    // Close HTTP server
    await new Promise<void>((resolve, reject) => {
      server!.close((err) => {
        if (err) {
          reject(err);
        } else {
          Logger.info('HTTP server closed');
          resolve();
        }
      });
    });

    // Close database connection
    await prisma.$disconnect();
    Logger.info('Database connection closed');

    // Close Redis connection
    await closeRedis();
    Logger.info('Redis connection closed');

    // Clear timeout
    clearTimeout(shutdownTimeout);
    
    Logger.info('Graceful shutdown completed successfully');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = (error: Error) => {
  Logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
    name: error.name,
  });
  
  // Attempt graceful shutdown
  gracefulShutdown('UNCAUGHT_EXCEPTION').catch((err) => {
    Logger.error('Failed to shutdown gracefully:', err);
    process.exit(1);
  });
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = (reason: any, promise: Promise<any>) => {
  Logger.error('Unhandled Rejection:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    promise: promise,
  });
  
  // Attempt graceful shutdown
  gracefulShutdown('UNHANDLED_REJECTION').catch((err) => {
    Logger.error('Failed to shutdown gracefully:', err);
    process.exit(1);
  });
};

/**
 * Handle termination signals
 */
const handleTerminationSignals = () => {
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT'];
  
  signals.forEach((signal) => {
    process.on(signal, () => {
      gracefulShutdown(signal);
    });
  });
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Log startup information
    Logger.info('Starting Velozity Backend Server...');
    Logger.info(`Environment: ${env.NODE_ENV}`);
    Logger.info(`Node Version: ${process.version}`);
    Logger.info(`Platform: ${process.platform}`);

    // Create Express app
    const app = await createApp();
    
    // Create HTTP server
    server = http.createServer(app);
    
    // Set server timeout
    server.timeout = 30000; // 30 seconds
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds

    // Start listening
    server.listen(env.PORT, () => {
      Logger.info(`✅ Server started successfully!`);
      Logger.info(`   URL: http://localhost:${env.PORT}`);
      Logger.info(`   Environment: ${env.NODE_ENV}`);
      Logger.info(`   Port: ${env.PORT}`);
      Logger.info(`   Process ID: ${process.pid}`);
      
      if (env.NODE_ENV === 'development') {
        Logger.info(`   Health Check: http://localhost:${env.PORT}/health`);
      }
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        Logger.error(`Port ${env.PORT} is already in use. Please free up the port or use a different one.`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        Logger.error(`Insufficient permissions to listen on port ${env.PORT}. Try using a port above 1024.`);
        process.exit(1);
      } else {
        Logger.error('Server error:', error);
        process.exit(1);
      }
    });

    // Handle server close
    server.on('close', () => {
      Logger.info('Server closed');
    });

  } catch (error) {
    Logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Validate environment before starting
 */
const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'INTERNAL_API_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    Logger.error('Missing required environment variables:', missingVars);
    Logger.error('Please check your .env file');
    process.exit(1);
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://') && !process.env.DATABASE_URL.startsWith('file:')) {
    Logger.error('DATABASE_URL must start with postgresql:// or file: (for SQLite)');
    process.exit(1);
  }

  // Validate JWT secret length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    Logger.warn('JWT_SECRET is less than 32 characters. This is insecure for production!');
    if (env.NODE_ENV === 'production') {
      Logger.error('JWT_SECRET must be at least 32 characters in production');
      process.exit(1);
    }
  }

  // Validate encryption key length
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    Logger.warn('ENCRYPTION_KEY is less than 32 characters. This is insecure for production!');
    if (env.NODE_ENV === 'production') {
      Logger.error('ENCRYPTION_KEY must be at least 32 characters in production');
      process.exit(1);
    }
  }

  Logger.info('✅ Environment validation passed');
};

/**
 * Main function to bootstrap the application
 */
const bootstrap = async () => {
  // Validate environment variables
  validateEnvironment();

  // Set up error handlers
  process.on('uncaughtException', handleUncaughtException);
  process.on('unhandledRejection', handleUnhandledRejection);
  
  // Set up termination signal handlers
  handleTerminationSignals();

  // Start the server
  await startServer();
};

// Bootstrap the application
bootstrap().catch((error) => {
  Logger.error('Bootstrap failed:', error);
  process.exit(1);
});

// Export for testing
export { server };