// src/services/audit.service.ts
import crypto from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuditRepository } from '../repositories/audit.repository';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string;
  previousValue: any;
  newValue: any;
  userId: string;
  apiKeyId: string;
  ipAddress: string;
  userAgent: string;
  tenantId: string;
}

export class AuditService {
  constructor(
    private auditRepo: AuditRepository,
    private prisma: PrismaClient
  ) {}

  private calculateAuditHash(
    data: AuditLogEntry,
    previousHash: string | null
  ): string {
    // Create the exact same structure as the seed script
    const hashData = {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      previousValue: data.previousValue === null ? null : data.previousValue,
      newValue: data.newValue,
      userId: data.userId,
      apiKeyId: data.apiKeyId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      tenantId: data.tenantId,
      previousHash: previousHash
    };
    
    // Convert to string with consistent formatting
    const dataString = JSON.stringify(hashData);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // src/services/audit.service.ts - Fix the log method
async log(entry: AuditLogEntry): Promise<void> {
  // Validate tenantId
  if (!entry.tenantId) {
    throw new Error('Tenant ID is required to create audit log');
  }
  
  const previousLog = await this.auditRepo.getLastLog(entry.tenantId);
  const chainHash = this.calculateAuditHash(entry, previousLog?.chainHash || null);
  
  // Handle JSON values properly
  const auditData: any = {
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    newValue: entry.newValue,
    userId: entry.userId,
    apiKeyId: entry.apiKeyId,
    ipAddress: entry.ipAddress,
    userAgent: entry.userAgent,
    previousHash: previousLog?.chainHash || null,
    chainHash,
    tenantId: entry.tenantId  // Pass tenantId directly
  };
  
  // Handle previousValue - use undefined for null to avoid Prisma.JsonNull
  if (entry.previousValue !== undefined && entry.previousValue !== null) {
    auditData.previousValue = entry.previousValue;
  }
  
  await this.auditRepo.create(auditData);
}

  async getLogs(filter: any) {
    return this.auditRepo.findAll(filter);
  }

  async verifyChain(tenantId: string) {
    const logs = await this.auditRepo.getChain(tenantId);
    let previousHash: string | null = null;
    let verifiedLogs = 0;
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      // Check if previousValue exists (not undefined)
      // When previousValue is null in JSON, it will be stored as null
      const previousValue = log.previousValue === undefined ? null : log.previousValue;
      
      const logData = {
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        previousValue: previousValue,
        newValue: log.newValue,
        userId: log.userId,
        apiKeyId: log.apiKeyId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        tenantId: log.tenantId
      };
      
      const expectedHash = this.calculateAuditHash(logData, previousHash);
      
      if (log.chainHash !== expectedHash) {
        return {
          valid: false,
          brokenAt: {
            id: log.id,
            index: i,
            expectedHash,
            actualHash: log.chainHash
          },
          totalLogs: logs.length,
          verifiedLogs: i
        };
      }
      
      if (previousHash && log.previousHash !== previousHash) {
        return {
          valid: false,
          brokenAt: {
            id: log.id,
            index: i,
            expectedHash: previousHash,
            actualHash: log.previousHash || 'null'
          },
          totalLogs: logs.length,
          verifiedLogs: i
        };
      }
      
      previousHash = expectedHash;
      verifiedLogs++;
    }
    
    return { 
      valid: true, 
      totalLogs: logs.length, 
      verifiedLogs 
    };
  }
}