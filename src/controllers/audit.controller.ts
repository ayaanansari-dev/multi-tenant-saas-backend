import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';
import { ResponseUtil } from '../utils/response.util';

export class AuditController {
  constructor(private auditService: AuditService) {}
  
  getAuditLogs = async (req: Request, res: Response) => {
    const { entityType, entityId, userId, action, startDate, endDate, cursor, limit } = req.query;
    const logs = await this.auditService.getLogs({
      entityType: entityType as string,
      entityId: entityId as string,
      userId: userId as string,
      action: action as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      cursor: cursor as string,
      limit: limit ? parseInt(limit as string) : 50,
    });
    ResponseUtil.success(res, logs.data, 200, {
      nextCursor: logs.nextCursor,
      hasMore: logs.hasMore,
    });
  };
  
  verifyChain = async (req: Request, res: Response) => {
    const result = await this.auditService.verifyChain((req as any).tenantId);
    ResponseUtil.success(res, result);
  };
}