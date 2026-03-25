export interface AuditLogEntry {
  id?: string;
  tenantId: string;
  action: string;
  entityType: string;
  entityId: string;
  previousValue: any;
  newValue: any;
  userId: string;
  apiKeyId: string;
  ipAddress: string;
  userAgent: string;
  previousHash?: string | null;
  chainHash?: string;
  createdAt?: Date;
}

export interface AuditLogFilter {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  cursor?: string;
  limit?: number;
}

export interface ChainVerificationResult {
  valid: boolean;
  brokenAt?: {
    id: string;
    index: number;
    expectedHash: string;
    actualHash: string;
  };
  totalLogs: number;
  verifiedLogs: number;
}