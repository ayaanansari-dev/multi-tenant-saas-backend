// src/repositories/user.repository.ts
import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  async findById(id: string) {
    const where: Prisma.UserWhereUniqueInput = { id };
    
    const user = await this.prisma.user.findUnique({
      where,
      include: {
        apiKeys: {
          where: { isActive: true },
          select: { id: true, name: true, keyPrefix: true },
        },
        tenant: true,
      },
    });
    
    if (!user) return null;
    return this.ensureTenantAccess(user);
  }
  
  async findByEmail(email: string) {
    // For findByEmail, we need to consider tenant isolation
    const where: Prisma.UserWhereInput = { email };
    if (this.tenantId) {
      where.tenantId = this.tenantId;
    }
    
    const user = await this.prisma.user.findFirst({
      where,
      include: { tenant: true },
    });
    
    if (!user) return null;
    return this.ensureTenantAccess(user);
  }
  
  async findAll(params: { skip?: number; take?: number; cursor?: string; role?: string }) {
    const { skip, take = 50, cursor, role } = params;
    
    const where: Prisma.UserWhereInput = {};
    if (this.tenantId) where.tenantId = this.tenantId;
    if (role) where.role = role as any;
    
    const users = await this.prisma.user.findMany({
      where,
      skip,
      take,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        tenantId: true,
        _count: { select: { apiKeys: true } },
      },
    });
    
    return this.ensureArrayTenantAccess(users);
  }
  
  async create(data: { 
    email: string; 
    name: string; 
    role: string; 
    tenantId: string 
  }) {
    // Validate tenantId
    if (!data.tenantId) {
      throw new Error('Tenant ID is required to create user');
    }
    
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role as any,
        tenant: {
          connect: { id: data.tenantId }
        }
      },
    });
  }
  
  async update(id: string, data: Prisma.UserUpdateInput) {
    // First verify the user exists and belongs to the tenant
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
  
  async delete(id: string) {
    // First verify the user exists and belongs to the tenant
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    return this.prisma.user.delete({
      where: { id },
    });
  }
  
  async count() {
    const where = this.tenantId ? { tenantId: this.tenantId } : {};
    return this.prisma.user.count({ where });
  }
}