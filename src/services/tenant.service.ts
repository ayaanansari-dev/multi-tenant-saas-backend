import { TenantRepository } from '../repositories/tenant.repository';
import { AuditService } from './audit.service';
import { ERROR_CODES } from '../constants/errors';
import { AUDIT_ACTIONS } from '../constants';

export class TenantService {
  constructor(
    private tenantRepo: TenantRepository,
    private auditService: AuditService
  ) {}
  
  async getTenantById(id: string) {
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant) {
      throw new Error(ERROR_CODES.TENANT_NOT_FOUND);
    }
    return tenant;
  }
  
  async createTenant(name: string, userId: string) {
    const existing = await this.tenantRepo.findByName(name);
    if (existing) {
      throw new Error('Tenant name already exists');
    }
    
    const tenant = await this.tenantRepo.create({ name });
    
    await this.auditService.log({
      action: AUDIT_ACTIONS.TENANT_UPDATED,
      entityType: 'Tenant',
      entityId: tenant.id,
      previousValue: null,
      newValue: { name },
      userId,
      apiKeyId: 'system',
      ipAddress: 'system',
      userAgent: 'system',
      tenantId: tenant.id,
    });
    
    return tenant;
  }
  
  async updateTenant(id: string, name: string, userId: string) {
    const oldTenant = await this.tenantRepo.findById(id);
    if (!oldTenant) {
      throw new Error(ERROR_CODES.TENANT_NOT_FOUND);
    }
    
    const updated = await this.tenantRepo.update(id, { name });
    
    await this.auditService.log({
      action: AUDIT_ACTIONS.TENANT_UPDATED,
      entityType: 'Tenant',
      entityId: id,
      previousValue: { name: oldTenant.name },
      newValue: { name },
      userId,
      apiKeyId: 'system',
      ipAddress: 'system',
      userAgent: 'system',
      tenantId: id,
    });
    
    return updated;
  }
  
  async getTenantStats(id: string) {
    return this.tenantRepo.getStats(id);
  }
async getTenantName(tenantId: string): Promise<string> {
  const tenant = await this.tenantRepo.findById(tenantId);
  return tenant?.name || 'Unknown Tenant';
}
}