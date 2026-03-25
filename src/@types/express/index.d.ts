// src/@types/express/index.d.ts
import { Request } from 'express';

declare module 'express' {
  export interface Request {
    tenantId: string;
    userId: string;
    apiKeyId: string;
    userRole: string;
    requestId: string;
  }
}