// src/services/rateLimiter.service.ts
import Redis from 'ioredis';
import { Logger } from '../config/logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  remaining: number;
  resetAt: Date;
  tier: string;
}

export class RateLimiterService {
  constructor(
    private redis: Redis,
    private log: typeof Logger = Logger
  ) {}

  async checkLimit(
    key: string,
    config: RateLimitConfig,
    tier: string
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Lua script for atomic sliding window operation
    const luaScript = `
      local key = KEYS[1]
      local now = tonumber(ARGV[1])
      local windowStart = tonumber(ARGV[2])
      local maxRequests = tonumber(ARGV[3])
      
      -- Remove old entries
      redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)
      
      -- Count current requests
      local current = redis.call('ZCARD', key)
      
      if current < maxRequests then
        -- Add current request with timestamp as score
        local timestamp = now .. ':' .. math.random()
        redis.call('ZADD', key, now, timestamp)
        -- Set expiry slightly longer than window
        redis.call('EXPIRE', key, math.ceil(config.windowMs / 1000) + 10)
        return {1, current + 1, maxRequests - current - 1, now + (maxRequests - current) * 100}
      else
        -- Get oldest request timestamp
        local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
        local oldestScore = tonumber(oldest[2])
        -- Calculate when this request would be allowed
        local resetAt = oldestScore + config.windowMs
        return {0, current, 0, resetAt}
      end
    `;

    try {
      const result = await this.redis.eval(
        luaScript,
        1,
        key,
        now,
        windowStart,
        config.maxRequests
      ) as [number, number, number, number];

      const [allowed, current, remaining, resetAt] = result;

      return {
        allowed: allowed === 1,
        current,
        remaining: Math.max(0, remaining),
        resetAt: new Date(resetAt),
        tier
      };
    } catch (error) {
      this.log.error('Rate limit check error', { error, key, tier });
      // Fail open - allow the request on error
      return {
        allowed: true,
        current: 0,
        remaining: config.maxRequests,
        resetAt: new Date(now + config.windowMs),
        tier
      };
    }
  }

  async resetLimit(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.log.error('Failed to reset rate limit', { error, key });
    }
  }

  async getCurrentUsage(key: string): Promise<number> {
    try {
      return await this.redis.zcard(key);
    } catch (error) {
      this.log.error('Failed to get current usage', { error, key });
      return 0;
    }
  }
}