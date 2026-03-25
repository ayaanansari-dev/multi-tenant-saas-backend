import { Redis } from 'ioredis';
import { prisma } from '../config/database';
import { Logger } from '../config/logger';

export class MetricsService {
  constructor(private redis: Redis) {}
  
  async getTenantStats(tenantId: string) {
    const [
      userCount,
      apiKeyCount,
      auditLogCount,
      recentRequests,
      rateLimitHits,
    ] = await Promise.all([
      prisma.user.count({ where: { tenantId } }),
      prisma.apiKey.count({ where: { tenantId, isActive: true } }),
      prisma.auditLog.count({ where: { tenantId } }),
      this.getRecentRequests(tenantId),
      this.getRateLimitHits(tenantId),
    ]);
    
    return {
      tenantId,
      userCount,
      apiKeyCount,
      auditLogCount,
      recentRequests,
      rateLimitHits,
      timestamp: new Date(),
    };
  }
  
  async getRecentRequests(tenantId: string): Promise<number> {
    const key = `metrics:requests:${tenantId}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }
  
  async getRateLimitHits(tenantId: string): Promise<number> {
    const key = `metrics:ratelimit:${tenantId}`;
    const count = await this.redis.get(key);
    return parseInt(count || '0');
  }
  
  async incrementRequests(tenantId: string) {
    const key = `metrics:requests:${tenantId}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 3600); // Keep for 1 hour
  }
  
  async incrementRateLimitHits(tenantId: string) {
    const key = `metrics:ratelimit:${tenantId}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 86400); // Keep for 24 hours
  }
  
  async getGlobalMetrics() {
    const [
      totalTenants,
      totalUsers,
      totalApiKeys,
      activeKeys,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.apiKey.count(),
      prisma.apiKey.count({ where: { isActive: true } }),
    ]);
    
    return {
      totalTenants,
      totalUsers,
      totalApiKeys,
      activeKeys,
      timestamp: new Date(),
    };
  }
}