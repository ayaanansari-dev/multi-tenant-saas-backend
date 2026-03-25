// src/repositories/base.repository.ts
import { PrismaClient } from '@prisma/client';
import { prisma } from '../config/database';

export class BaseRepository {
  protected prisma: PrismaClient;
  protected tenantId?: string;
  
  constructor(tenantId?: string) {
    this.prisma = prisma;
    this.tenantId = tenantId;
  }
  
  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
    return this;
  }
  
  // Helper to add tenant filter to where clause
  protected withTenantFilter<T extends Record<string, any>>(where: T): T & { tenantId: string } {
    if (!this.tenantId) {
      throw new Error('Tenant context required for this operation');
    }
    return {
      ...where,
      tenantId: this.tenantId,
    };
  }
  
  // Helper to ensure tenant access for a record
  protected ensureTenantAccess<T extends { tenantId: string }>(record: T): T {
    if (this.tenantId && record.tenantId !== this.tenantId) {
      throw new Error('Tenant isolation violation: Access denied to resource from another tenant');
    }
    return record;
  }
  
  protected ensureArrayTenantAccess<T extends { tenantId: string }>(records: T[]): T[] {
    if (this.tenantId) {
      const invalidRecords = records.filter(r => r.tenantId !== this.tenantId);
      if (invalidRecords.length > 0) {
        throw new Error('Tenant isolation violation: Some records belong to different tenants');
      }
    }
    return records;
  }
}