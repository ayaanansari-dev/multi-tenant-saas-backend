// src/services/user.service.ts
import { UserRepository } from '../repositories/user.repository';
import { AuditService } from './audit.service';
import { EmailQueueService } from '../queues/email.queue';
import { ERROR_CODES } from '../constants/errors';
import { AUDIT_ACTIONS, ROLES, Role } from '../constants';
import { hashValue } from '../utils/hash.util';
import { TenantRepository } from '../repositories/tenant.repository';

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private auditService: AuditService,
    private emailQueue: EmailQueueService,
    private tenantRepo?: TenantRepository
  ) {}
  
  async getUsers(params: any) {
    return this.userRepo.findAll(params);
  }
  
  async getUserById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error(ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    return user;
  }
  
  async createUser(data: {
    email: string;
    name: string;
    role: Role;
    tenantId: string;
    invitedBy: string;
    apiKeyId: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists');
    }
    
    // Ensure tenantId exists
    if (!data.tenantId) {
      throw new Error('Tenant ID is required to create user');
    }
    
    // Fix: Pass tenantId directly, not tenant object
    const user = await this.userRepo.create({
      email: data.email,
      name: data.name,
      role: data.role,
      tenantId: data.tenantId  // Pass tenantId directly
    });
    
    // Log audit with proper tenantId
    await this.auditService.log({
      action: AUDIT_ACTIONS.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      previousValue: null,
      newValue: { email: user.email, name: user.name, role: user.role },
      userId: data.invitedBy,
      apiKeyId: data.apiKeyId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      tenantId: data.tenantId,
    }).catch(error => {
      console.error('Failed to log user creation audit:', error);
    });
    
    // Get tenant name for email
    let tenantName = data.tenantId;
    if (this.tenantRepo) {
      const tenant = await this.tenantRepo.findById(data.tenantId);
      tenantName = tenant?.name || data.tenantId;
    }
    
    // Send invitation email via queue
    await this.emailQueue.sendInvitation(
      data.email,
      {
        invitedBy: data.invitedBy,
        tenantName: tenantName,
        role: data.role,
        inviteLink: `${process.env.APP_URL}/invite/${user.id}`,
      },
      data.tenantId
    );
    
    return user;
  }
  
  async updateUser(id: string, updates: any, userId: string, apiKeyId: string) {
    const oldUser = await this.userRepo.findById(id);
    if (!oldUser) {
      throw new Error(ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    
    const updated = await this.userRepo.update(id, updates);
    
    await this.auditService.log({
      action: AUDIT_ACTIONS.USER_UPDATED,
      entityType: 'User',
      entityId: id,
      previousValue: { name: oldUser.name, role: oldUser.role },
      newValue: updates,
      userId,
      apiKeyId,
      ipAddress: '',
      userAgent: '',
      tenantId: oldUser.tenantId,
    });
    
    return updated;
  }
  
  async deleteUser(id: string, userId: string, apiKeyId: string) {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new Error(ERROR_CODES.RESOURCE_NOT_FOUND);
    }
    
    await this.userRepo.delete(id);
    
    await this.auditService.log({
      action: AUDIT_ACTIONS.USER_DELETED,
      entityType: 'User',
      entityId: id,
      previousValue: { email: user.email, name: user.name },
      newValue: null,
      userId,
      apiKeyId,
      ipAddress: '',
      userAgent: '',
      tenantId: user.tenantId,
    });
  }
  
  async checkPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const user = await this.userRepo.findById(userId);
    if (!user) return false;
    
    const { ROLE_PERMISSIONS } = await import('../constants');
    const permissions = ROLE_PERMISSIONS[user.role as Role];
    
    return permissions.includes(requiredPermission);
  }
}