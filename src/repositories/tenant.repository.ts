import { Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class TenantRepository extends BaseRepository {
  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, email: true, name: true, role: true },
        },
        apiKeys: {
          where: { isActive: true },
          select: { id: true, name: true, keyPrefix: true, lastUsedAt: true },
        },
      },
    });
  }
  
  async findByName(name: string) {
    return this.prisma.tenant.findUnique({
      where: { name },
    });
  }
  
  async create(data: Prisma.TenantCreateInput) {
    return this.prisma.tenant.create({
      data,
    });
  }
  
  async update(id: string, data: Prisma.TenantUpdateInput) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }
  
  async delete(id: string) {
    return this.prisma.tenant.delete({
      where: { id },
    });
  }
  
  async getStats(id: string) {
    const [usersCount, apiKeysCount, auditLogsCount] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.apiKey.count({ where: { tenantId: id } }),
      this.prisma.auditLog.count({ where: { tenantId: id } }),
    ]);
    
    return { usersCount, apiKeysCount, auditLogsCount };
  }
}