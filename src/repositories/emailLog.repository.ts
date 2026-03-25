// src/repositories/emailLog.repository.ts
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class EmailLogRepository extends BaseRepository {
  async create(data: {
    jobId: string;
  type: string;
  recipient: string;
  status: string;
  error?: string;
  metadata?: any;
  tenantId: string; 
  }) {
    // Validate tenantId
    if (!data.tenantId) {
      throw new Error('Tenant ID is required to create email log');
    }
    
    return this.prisma.emailLog.create({
      data: {
      jobId: data.jobId,
      type: data.type,
      recipient: data.recipient,
      status: data.status,
      error: data.error,
      metadata: data.metadata,
      tenant: {
        connect: { id: data.tenantId }  // Repository handles the relation
      }
    },
    });
  }
  
  async findByJobId(jobId: string) {
    const emailLog = await this.prisma.emailLog.findFirst({
      where: { jobId },
    });
    
    if (!emailLog) return null;
    return this.ensureTenantAccess(emailLog);
  }
  
  async updateStatus(jobId: string, status: string, error?: string) {
    const emailLog = await this.findByJobId(jobId);
    if (!emailLog) {
      throw new Error('Email log not found');
    }
    
    return this.prisma.emailLog.update({
      where: { id: emailLog.id },
      data: { status, error },
    });
  }
  
  async getStats(tenantId: string, days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const stats = await this.prisma.emailLog.groupBy({
      by: ['status'],
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });
    
    return stats;
  }
}