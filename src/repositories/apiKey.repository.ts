// src/repositories/apiKey.repository.ts
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ApiKeyRepository extends BaseRepository {
  async findById(id: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        tenant: true,
      },
    });
    
    if (!apiKey) return null;
    return this.ensureTenantAccess(apiKey);
  }
  
  async findByPrefix(prefix: string) {
    const where: Prisma.ApiKeyWhereInput = { keyPrefix: prefix };
    if (this.tenantId) where.tenantId = this.tenantId;
    
    const apiKeys = await this.prisma.apiKey.findMany({
      where,
      include: {
        user: {
          select: { id: true, email: true, name: true, role: true },
        },
        tenant: true,
      },
    });
    
    return this.ensureArrayTenantAccess(apiKeys);
  }
  
  async findByUser(userId: string) {
    const where: Prisma.ApiKeyWhereInput = { userId };
    if (this.tenantId) where.tenantId = this.tenantId;
    
    const apiKeys = await this.prisma.apiKey.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { tenant: true },
    });
    
    return this.ensureArrayTenantAccess(apiKeys);
  }
  
  async findAllActive() {
    const where: Prisma.ApiKeyWhereInput = { isActive: true };
    if (this.tenantId) where.tenantId = this.tenantId;
    
    return this.prisma.apiKey.findMany({
      where,
      include: {
        user: {
          select: { email: true, name: true },
        },
        tenant: true,
      },
    });
  }
  
  async create(data:{  
  name: string; 
  keyHash: string; 
  keyPrefix: string; 
  userId: string; 
  tenantId: string 
}) {
    // Validate tenantId
    if (!data.tenantId) {
      throw new Error('Tenant ID is required to create API key');
    }
    
    return this.prisma.apiKey.create({
      data: {
        name: data.name,
        keyHash: data.keyHash,
        keyPrefix: data.keyPrefix,
        user: {
          connect: { id: data.userId }
        },
        tenant: {
          connect: { id: data.tenantId }
        }
      },
    });
  }
  
  async update(id: string, data: Prisma.ApiKeyUpdateInput) {
    // First verify the API key exists and belongs to the tenant
    const existingKey = await this.findById(id);
    if (!existingKey) {
      throw new Error('API key not found');
    }
    
    return this.prisma.apiKey.update({
      where: { id },
      data,
    });
  }
  
  async updateLastUsed(id: string) {
    // First verify the API key exists and belongs to the tenant
    const existingKey = await this.findById(id);
    if (!existingKey) {
      throw new Error('API key not found');
    }
    
    return this.prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }
  
  async delete(id: string) {
    // First verify the API key exists and belongs to the tenant
    const existingKey = await this.findById(id);
    if (!existingKey) {
      throw new Error('API key not found');
    }
    
    return this.prisma.apiKey.delete({
      where: { id },
    });
  }
  
  async deleteExpired() {
    return this.prisma.apiKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
    });
  }
}