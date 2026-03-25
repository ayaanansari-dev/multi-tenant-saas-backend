// src/repositories/audit.repository.ts
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { AuditLogFilter } from '../types/audit.types';

export class AuditRepository extends BaseRepository {
  async create(data: {
    action: string;
  entityType: string;
  entityId: string;
  previousValue?: any;
  newValue: any;
  userId: string;
  apiKeyId: string;
  ipAddress: string;
  userAgent: string;
  previousHash: string | null;
  chainHash: string;
  tenantId: string; 
  }) {
    // Validate tenantId
    if (!data.tenantId) {
      throw new Error('Tenant ID is required to create audit log');
    }
    
    // Build the data object properly
    const createData: any = {
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      newValue: data.newValue,
      userId: data.userId,
      apiKeyId: data.apiKeyId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      previousHash: data.previousHash,
      chainHash: data.chainHash,
      tenant: {
        connect: { id: data.tenantId }
      }
    };
    
    // Only add previousValue if it exists (not undefined)
    if (data.previousValue !== undefined && data.previousValue !== null) {
      createData.previousValue = data.previousValue;
    }
    
    return this.prisma.auditLog.create({
      data: createData
    });
  }
  
  async findById(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
    });
    
    if (!auditLog) return null;
    return this.ensureTenantAccess(auditLog);
  }
  
  async findAll(filter: AuditLogFilter) {
    const { entityType, entityId, userId, action, startDate, endDate, cursor, limit = 50 } = filter;
    
    const where: Prisma.AuditLogWhereInput = {};
    if (this.tenantId) where.tenantId = this.tenantId;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    const logs = await this.prisma.auditLog.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    
    // Ensure tenant access for all logs
    const validatedLogs = this.ensureArrayTenantAccess(logs);
    
    let nextCursor: string | undefined;
    if (validatedLogs.length > limit) {
      const nextItem = validatedLogs.pop();
      nextCursor = nextItem?.id;
    }
    
    return {
      data: validatedLogs,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }
  
  async getLastLog(tenantId: string) {
    const log = await this.prisma.auditLog.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    
    return log ? this.ensureTenantAccess(log) : null;
  }
  
  async getChain(tenantId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    
    return this.ensureArrayTenantAccess(logs);
  }
  
  async countByTenant(tenantId: string) {
    return this.prisma.auditLog.count({ where: { tenantId } });
  }
}