// src/services/apiKey.service.ts
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { ApiKeyRepository } from '../repositories/apiKey.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailQueueService } from '../queues/email.queue';
import { AuditService } from './audit.service';

export class ApiKeyService {
  constructor(
    private apiKeyRepo: ApiKeyRepository,
    private emailQueue: EmailQueueService,
    private auditService: AuditService,
    private userRepo?: UserRepository
  ) {}

  async createKey(userId: string, name: string, tenantId: string) {
    const keyPrefix = crypto.randomBytes(4).toString('hex');
    const keySecret = crypto.randomBytes(32).toString('hex');
    const plainKey = `${keyPrefix}_${keySecret}`;
    
    const keyHash = await bcrypt.hash(plainKey, 12);
    
    // Fix: Pass correct parameters to repository create method
    const apiKey = await this.apiKeyRepo.create({
      name,
      keyHash,
      keyPrefix,
      userId,
      tenantId  // Pass tenantId directly
    });
    
    return { apiKey, plainKey };
  }

  async getUserKeys(userId: string) {
    return this.apiKeyRepo.findByUser(userId);
  }

  async rotateKey(apiKeyId: string, userId: string) {
    const oldKey = await this.apiKeyRepo.findById(apiKeyId);
    if (!oldKey) throw new Error('Key not found');
    
    // Create new key
    const { apiKey: newKey, plainKey } = await this.createKey(
      userId,
      `${oldKey.name} (rotated)`,
      oldKey.tenantId
    );
    
    // Link rotation
    await this.apiKeyRepo.update(oldKey.id, {
      rotatedFromId: oldKey.id,
      rotatedAt: new Date(),
      isActive: false
    });
    
    // Schedule old key deletion (15 min grace period)
    setTimeout(async () => {
      await this.apiKeyRepo.delete(oldKey.id);
    }, 15 * 60 * 1000);
    
    // Log rotation
    await this.auditService.log({
      action: 'API_KEY_ROTATED',
      entityType: 'ApiKey',
      entityId: apiKeyId,
      previousValue: { keyPrefix: oldKey.keyPrefix },
      newValue: { keyPrefix: newKey.keyPrefix },
      userId,
      apiKeyId: oldKey.id,
      ipAddress: '',
      userAgent: '',
      tenantId: oldKey.tenantId
    });
    
    // Send email notification with tenantId
    if (this.userRepo) {
      const user = await this.userRepo.findById(userId);
      if (user) {
        await this.emailQueue.sendKeyRotated(
          user.email,
          {
            keyName: oldKey.name,
            rotatedAt: new Date(),
            oldKeyPrefix: oldKey.keyPrefix
          },
          oldKey.tenantId
        );
      }
    }
    
    return { newKey: plainKey, gracePeriod: 15 };
  }

  async revokeKey(apiKeyId: string, userId: string) {
    const key = await this.apiKeyRepo.findById(apiKeyId);
    if (!key) throw new Error('Key not found');
    
    await this.apiKeyRepo.update(apiKeyId, { isActive: false });
    
    await this.auditService.log({
      action: 'API_KEY_REVOKED',
      entityType: 'ApiKey',
      entityId: apiKeyId,
      previousValue: { isActive: true },
      newValue: { isActive: false },
      userId,
      apiKeyId,
      ipAddress: '',
      userAgent: '',
      tenantId: key.tenantId
    });
  }

  async validateKey(plainKey: string) {
    const [prefix] = plainKey.split('_');
    const keys = await this.apiKeyRepo.findByPrefix(prefix);
    
    for (const key of keys) {
      const isValid = await bcrypt.compare(plainKey, key.keyHash);
      if (isValid && key.isActive) {
        await this.apiKeyRepo.updateLastUsed(key.id);
        return key;
      }
    }
    
    return null;
  }
}