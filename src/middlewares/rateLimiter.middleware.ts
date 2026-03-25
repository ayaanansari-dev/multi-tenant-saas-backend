// src/middlewares/rateLimiter.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { RateLimiterService, RateLimitResult } from '../services/rateLimiter.service';
import Redis from 'ioredis';
import { EmailQueueService } from '../queues/email.queue';
import { ApiKeyRepository } from '../repositories/apiKey.repository';
import { Logger } from '../config/logger';
import { CustomRequest } from '../types/custom-request';

export class RateLimiterMiddleware {
  constructor(
    private rateLimiter: RateLimiterService,
    private redis: Redis,
    private emailQueue?: EmailQueueService,
    private apiKeyRepo?: ApiKeyRepository
  ) {}

  createLimiter(options: {
    global?: boolean;
    endpoint?: string;
    burst?: boolean;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const customReq = req as CustomRequest;
      const tenantId = customReq.tenantId;
      const apiKeyId = customReq.apiKeyId;
      
      if (!tenantId && !apiKeyId) {
        return next();
      }

      try {
        // 1. Global tier (per tenant)
        if (options.global && tenantId) {
          const globalResult = await this.rateLimiter.checkLimit(
            `ratelimit:global:${tenantId}`,
            { windowMs: 60000, maxRequests: 1000 },
            'global'
          );
          
          if (!globalResult.allowed) {
            await this.trackRateLimitHit(tenantId);
            return this.sendRateLimitResponse(res, globalResult);
          }
        }

        // 2. Endpoint tier (per tenant per endpoint)
        if (options.endpoint && tenantId && options.endpoint) {
          const endpointResult = await this.rateLimiter.checkLimit(
            `ratelimit:endpoint:${options.endpoint}:${tenantId}`,
            { windowMs: 60000, maxRequests: 100 },
            'endpoint'
          );
          
          if (!endpointResult.allowed) {
            await this.trackRateLimitHit(tenantId);
            return this.sendRateLimitResponse(res, endpointResult);
          }
        }

        // 3. Burst tier (per API key, 5 second window)
       if (options.burst && apiKeyId) {
  const burstResult = await this.rateLimiter.checkLimit(
    `ratelimit:burst:${apiKeyId}`,
    { windowMs: 5000, maxRequests: 50 },  // 50 requests per 5 seconds
    'burst'
  );
  
  console.log(`Burst check - Allowed: ${burstResult.allowed}, Current: ${burstResult.current}, Remaining: ${burstResult.remaining}`);
  
  if (!burstResult.allowed) {
    if (tenantId) {
      await this.trackRateLimitHit(tenantId);
    }
    return this.sendRateLimitResponse(res, burstResult);
  }
}

        next();
      } catch (error) {
        Logger.error('Rate limit check failed', { error, tenantId, apiKeyId });
        next();
      }
    };
  }

  private async triggerRateLimitWarning(
  apiKeyId: string, 
  result: RateLimitResult, 
  tenantId: string
) {
  if (!this.emailQueue || !this.apiKeyRepo) {
    return;
  }

  try {
    const warningKey = `ratelimit:warning:${apiKeyId}`;
    const lastWarning = await this.redis.get(warningKey);
    
    if (lastWarning) {
      return;
    }

    const apiKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!apiKey || !(apiKey as any).user?.email) {
      Logger.warn('Could not send rate limit warning: No user email found', { apiKeyId });
      return;
    }

    // Send warning email with tenantId
    await this.emailQueue.sendRateLimitWarning(
      (apiKey as any).user.email,
      {
        apiKeyId,
        currentUsage: result.current,
        limit: result.current + result.remaining,
        resetAt: result.resetAt,
      },
      tenantId  // Add tenantId as third argument
    );

    await this.redis.setex(warningKey, 3600, 'sent');
    
    Logger.info('Rate limit warning sent', { apiKeyId, usage: result.current });
  } catch (error) {
    Logger.error('Failed to send rate limit warning', { error, apiKeyId });
  }
}

  private async trackRateLimitHit(tenantId: string) {
    try {
      const key = `metrics:ratelimit:${tenantId}`;
      await this.redis.incr(key);
      await this.redis.expire(key, 86400);
    } catch (error) {
      Logger.error('Failed to track rate limit hit', { error, tenantId });
    }
  }

  private sendRateLimitResponse(res: Response, result: RateLimitResult) {
    const limit = result.current + result.remaining;
    const resetInSeconds = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
    
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.getTime());
    res.setHeader('Retry-After', resetInSeconds);
    
    return res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please slow down your requests.',
        details: {
          tier: result.tier,
          limit: limit,
          current: result.current,
          remaining: result.remaining,
          resetIn: resetInSeconds * 1000,
          resetAt: result.resetAt.toISOString(),
        }
      }
    });
  }
}

export const createRateLimiterMiddleware = (
  rateLimiter: RateLimiterService,
  redis: Redis,
  emailQueue?: EmailQueueService,
  apiKeyRepo?: ApiKeyRepository
) => {
  const middleware = new RateLimiterMiddleware(rateLimiter, redis, emailQueue, apiKeyRepo);
  return middleware.createLimiter.bind(middleware);
};