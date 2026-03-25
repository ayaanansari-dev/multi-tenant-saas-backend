// src/types/custom-request.ts
import { Request } from 'express';

export interface CustomRequest extends Request {
  tenantId: string;
  userId: string;
  apiKeyId: string;
  userRole: string;
  requestId: string;
}