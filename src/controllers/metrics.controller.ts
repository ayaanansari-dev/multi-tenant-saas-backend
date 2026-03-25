import { Request, Response } from 'express';
import { MetricsService } from '../services/metrics.service';
import { ResponseUtil } from '../utils/response.util';

export class MetricsController {
  constructor(private metricsService: MetricsService) {}
  
  getTenantMetrics = async (req: Request, res: Response) => {
    const stats = await this.metricsService.getTenantStats((req as any).tenantId!);
    ResponseUtil.success(res, stats);
  };
  
  getGlobalMetrics = async (req: Request, res: Response) => {
    // Check internal API key
    const internalKey = req.headers['x-internal-api-key'];
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return ResponseUtil.error(res, 'UNAUTHORIZED', 'Invalid internal API key', 401);
    }
    
    const metrics = await this.metricsService.getGlobalMetrics();
    ResponseUtil.success(res, metrics);
  };
}