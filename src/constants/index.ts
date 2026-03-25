export const ROLES = {
  OWNER: 'OWNER',
  MEMBER: 'MEMBER',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // API Key management
  API_KEY_CREATE: 'api_key:create',
  API_KEY_READ: 'api_key:read',
  API_KEY_UPDATE: 'api_key:update',
  API_KEY_DELETE: 'api_key:delete',
  API_KEY_ROTATE: 'api_key:rotate',
  
  // Audit
  AUDIT_READ: 'audit:read',
  AUDIT_VERIFY: 'audit:verify',
  
  // Metrics
  METRICS_READ: 'metrics:read',
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.MEMBER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.API_KEY_READ,
    PERMISSIONS.API_KEY_CREATE,
    PERMISSIONS.API_KEY_UPDATE,
    PERMISSIONS.API_KEY_ROTATE,
  ],
};

export const RATE_LIMIT_TIERS = {
  GLOBAL: 'global',
  ENDPOINT: 'endpoint',
  BURST: 'burst',
} as const;

export const EMAIL_TYPES = {
  INVITATION: 'invitation',
  KEY_ROTATED: 'keyRotated',
  RATE_LIMIT_WARNING: 'rateLimitWarning',
} as const;

export const AUDIT_ACTIONS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  API_KEY_CREATED: 'API_KEY_CREATED',
  API_KEY_ROTATED: 'API_KEY_ROTATED',
  API_KEY_REVOKED: 'API_KEY_REVOKED',
  TENANT_UPDATED: 'TENANT_UPDATED',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;