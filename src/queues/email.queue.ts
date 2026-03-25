// src/queues/email.queue.ts
import { QueueManager } from "../config/queue";

export class EmailQueueService {
  constructor(private queueManager: QueueManager) {}

  async sendInvitation(
    to: string, 
    inviteData: {
      invitedBy: string;
      tenantName: string;
      role: string;
      inviteLink: string;
    }, 
    tenantId: string  // Make sure this is required
  ) {
    return this.queueManager.addEmailJob('invitation', to, inviteData, tenantId);
  }

  async sendKeyRotated(
    to: string, 
    keyData: {
      keyName: string;
      rotatedAt: Date;
      oldKeyPrefix: string;
    }, 
    tenantId: string  // Make sure this is required
  ) {
    return this.queueManager.addEmailJob('keyRotated', to, keyData, tenantId);
  }

  async sendRateLimitWarning(
    to: string, 
    warningData: {
      apiKeyId: string;
      currentUsage: number;
      limit: number;
      resetAt: Date;
    }, 
    tenantId: string  // Make sure this is required
  ) {
    return this.queueManager.addEmailJob('rateLimitWarning', to, warningData, tenantId);
  }
}