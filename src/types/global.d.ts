// src/types/global.d.ts
import { Server } from 'http';

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
  
  // Use a different name to avoid conflict
  var appServer: Server | undefined;
}

export {};