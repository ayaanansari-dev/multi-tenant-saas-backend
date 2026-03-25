export interface CreateApiKeyDTO {
  name: string;
  userId: string;
  tenantId: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  plainKey?: string; // Only returned on creation
}

export interface RotateKeyResponse {
  newKey: string;
  gracePeriod: number; // minutes
  oldKeyExpiresAt: Date;
}