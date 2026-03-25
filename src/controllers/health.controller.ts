import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { getRedisClient } from '../config/redis';
import { QueueManager } from '../config/queue';
import { ResponseUtil } from '../utils/response.util';
import { Logger } from '../config/logger';

export class HealthController {
  constructor(private queueManager: QueueManager) {}
  
  check = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const health:{
  status: string;
  timestamp: Date;
  uptime: number;
  checks: any;
  responseTime?: number; // ✅ add this
} = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      checks: {} as any,
    };
    
    // Check Database
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'up', latency: Date.now() - startTime };
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.database = { status: 'down',error: error instanceof Error ? error.message : String(error) };
      Logger.error('Health check failed: Database', error);
    }
    
    // Check Redis
    const redisStart = Date.now();
    try {
      const redis = getRedisClient();
      await redis.ping();
      health.checks.redis = { status: 'up', latency: Date.now() - redisStart };
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.redis = { status: 'down', error: error instanceof Error ? error.message : String(error) };
      Logger.error('Health check failed: Redis', error);
    }
    
    // Check Queue
    try {
      const queueDepth = await this.queueManager.getQueueDepth();
      health.checks.queue = { status: 'up', depth: queueDepth };
    } catch (error) {
      health.status = 'degraded';
      health.checks.queue = { status: 'degraded', error: error instanceof Error ? error.message : String(error) };
    }
    
    // Response time
    health.responseTime = Date.now() - startTime;
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    ResponseUtil.success(res, health, statusCode);
  };
}