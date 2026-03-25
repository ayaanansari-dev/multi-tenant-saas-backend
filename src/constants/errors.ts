export const ERROR_CODES = {
  // Auth errors
  INVALID_API_KEY: 'INVALID_API_KEY',
  API_KEY_EXPIRED: 'API_KEY_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Tenant errors
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_ISOLATION_VIOLATION: 'TENANT_ISOLATION_VIOLATION',
  
  // Rate limit errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // System errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  REDIS_ERROR: 'REDIS_ERROR',
} as const;

export const ERROR_MESSAGES: Record<keyof typeof ERROR_CODES, string> = {
  INVALID_API_KEY: 'Invalid or expired API key',
  API_KEY_EXPIRED: 'API key has expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_ISOLATION_VIOLATION: 'Tenant isolation violation detected',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  RESOURCE_NOT_FOUND: 'Requested resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database error occurred',
  REDIS_ERROR: 'Redis error occurred',
};