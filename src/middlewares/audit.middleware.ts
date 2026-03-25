// src/middlewares/audit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import { CustomRequest } from '../types/custom-request';

export const auditMiddleware = (auditService: AuditService) => {
  return (entityType: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const customReq = req as CustomRequest;
      const originalSend = res.json;
      
      // Only audit if we have tenant context
      if (!customReq.tenantId) {
        console.log(`Skipping audit for ${req.method} ${req.path}: No tenant context`);
        return next();
      }
      
      // Capture request data
      const requestData = {
        body: req.body,
        params: req.params,
        query: req.query,
      };
      
      // Store previous value if this is an update
      let previousValue: any = null;
      if (req.method === 'PUT' || req.method === 'PATCH') {
        // You would fetch the existing entity here
        previousValue = null;
      }
      
      // Override send to capture response
      res.json = function(data: any) {
        // Only audit write operations
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          const entityId = req.params.id || data?.id;
          
          // Make sure we have tenantId before logging
          if (customReq.tenantId) {
            auditService.log({
              action: `${req.method}_${entityType}`,
              entityType,
              entityId: entityId || 'unknown',
              previousValue: previousValue,
              newValue: req.method === 'DELETE' ? null : requestData.body,
              userId: customReq.userId,
              apiKeyId: customReq.apiKeyId,
              ipAddress: req.ip || 'unknown',
              userAgent: req.get('user-agent') || 'unknown',
              tenantId: customReq.tenantId,
            }).catch(error => {
              console.error('Failed to log audit:', error);
            });
          } else {
            console.log(`Cannot log audit: No tenantId for ${req.method} ${req.path}`);
          }
        }
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  };
};