// src/types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      tenantId: string;
      userId: string;
      apiKeyId: string;
      userRole: string;
      requestId: string;
    }
  }
}

// This export is required to make it a module
export {};