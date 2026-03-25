// src/app.ts
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { json, urlencoded } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CustomRequest } from './types/custom-request';
// Import types to ensure they're included
// import './types/global';

import { env } from './config/env';
import { prisma } from './config/database';
import { getRedisClient } from './config/redis';
import { QueueManager } from './config/queue';
import { Logger } from './config/logger';

// Middlewares
import { errorMiddleware } from './middlewares/error.middleware';
import { tenantMiddleware } from './middlewares/tenant.middleware';
import { createRateLimiterMiddleware } from './middlewares/rateLimiter.middleware';
import { authMiddleware } from './middlewares/auth.middleware';

// Services
import { ApiKeyService } from './services/apiKey.service';
import { UserService } from './services/user.service';
import { AuditService } from './services/audit.service';
import { RateLimiterService } from './services/rateLimiter.service';
import { MetricsService } from './services/metrics.service';
import { TenantService } from './services/tenant.service';
import { EmailService } from './services/email.service';

// Queues
import { EmailQueueService } from './queues/email.queue';
import { EmailWorker } from './queues/email.worker';

// Repositories
import { AuditRepository } from './repositories/audit.repository';
import { UserRepository } from './repositories/user.repository';
import { ApiKeyRepository } from './repositories/apiKey.repository';
import { TenantRepository } from './repositories/tenant.repository';
import { EmailLogRepository } from './repositories/emailLog.repository';

// Routes
import { createRouter } from './routes';

// AsyncLocalStorage for request context
import { AsyncLocalStorage } from 'async_hooks';

// Create AsyncLocalStorage instance for context propagation
export const asyncLocalStorage = new AsyncLocalStorage<{ 
  tenantId: string; 
  userId: string; 
  apiKeyId: string;
  requestId: string;
}>();

export const createApp = async (): Promise<Express> => {
  const app = express();
  const redis = getRedisClient();

  // Initialize repositories
  const auditRepo = new AuditRepository();
  const userRepo = new UserRepository();
  const apiKeyRepo = new ApiKeyRepository();
  const tenantRepo = new TenantRepository();
  const emailLogRepo = new EmailLogRepository();

  // Initialize queue manager
  const queueManager = new QueueManager({
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT),
    password: env.REDIS_PASSWORD,
  });

  // Initialize email service and queue
  const emailService = new EmailService(emailLogRepo);
  const emailQueueService = new EmailQueueService(queueManager);
  
  // Initialize email worker
  const emailWorker = new EmailWorker(redis, emailService);
await emailWorker.start().catch((error) => {
  Logger.error('Failed to start email worker:', error);
  // Don't exit - queue can work without worker in main app
  // Worker will run separately
});

  // Initialize services
  const auditService = new AuditService(auditRepo, prisma);
  const userService = new UserService(userRepo, auditService, emailQueueService,tenantRepo);
  const apiKeyService = new ApiKeyService(apiKeyRepo, emailQueueService, auditService, userRepo);
  const rateLimiterService = new RateLimiterService(redis, Logger);
  const metricsService = new MetricsService(redis);
  const tenantService = new TenantService(tenantRepo, auditService);

  // Create rate limiter middleware with dependencies
  const rateLimiterMiddleware = createRateLimiterMiddleware(
    rateLimiterService,
    redis,
    emailQueueService,
    apiKeyRepo
  );

  // Create auth middleware
  const auth = authMiddleware(userService);

  // Create tenant middleware
  const tenant = tenantMiddleware(apiKeyService);

  // Dependencies object for routes
  const dependencies = {
    userService,
    apiKeyService,
    auditService,
    rateLimiterService,
    metricsService,
    tenantService,
    queueManager,
    emailQueueService,
    auth,
    tenant,
  };

  // Middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: env.NODE_ENV === 'production' ? process.env.ALLOWED_ORIGINS?.split(',') : '*',
    credentials: true,
  }));
  app.use(compression());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  
  // Request context middleware with AsyncLocalStorage
  app.use((req: Request, res: Response, next: NextFunction) => {
  const customReq = req as CustomRequest;
  customReq.requestId = uuidv4();
  res.setHeader('X-Request-Id', customReq.requestId);
  
  asyncLocalStorage.run(
    { 
      tenantId: customReq.tenantId || '', 
      userId: customReq.userId || '', 
      apiKeyId: customReq.apiKeyId || '',
      requestId: customReq.requestId 
    },
    () => {
      next();
    }
  );
});
  // Public routes (no auth required)
  app.get('/health', async (req: Request, res: Response) => {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      services: {
        database: false,
        redis: false,
        queue: false,
      },
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = true;
    } catch (error) {
      health.status = 'unhealthy';
      Logger.error('Health check: Database down', error);
    }

    // Check Redis
    try {
      await redis.ping();
      health.services.redis = true;
    } catch (error) {
      health.status = 'unhealthy';
      Logger.error('Health check: Redis down', error);
    }

    // Check Queue
    try {
      const queueDepth = await queueManager.getQueueDepth();
      health.services.queue = true;
      (health as any).queueDepth = queueDepth;
    } catch (error) {
      health.status = 'degraded';
      Logger.error('Health check: Queue degraded', error);
    }

    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  });

  // Apply tenant middleware for all API routes
  app.use('/api', tenant);
  
  // Apply global rate limiter for all API routes
  app.use('/api', rateLimiterMiddleware({ global: true, burst: true }));
  
  // API routes
  app.use('/api', createRouter(dependencies));

  // 404 handler for undefined routes
  app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

  // Global error handler
  app.use(errorMiddleware);

  return app;
};

// No duplicate declaration here - we'll handle server in server.ts