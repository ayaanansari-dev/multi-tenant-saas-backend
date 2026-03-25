import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { ResponseUtil } from '../utils/response.util';
import { HTTP_STATUS } from '../constants';

export class TenantController {
  constructor(private tenantService: TenantService) {}
  
  getTenant = async (req: Request<{id:string}>, res: Response) => {
    const { id } = req.params;
    const tenant = await this.tenantService.getTenantById(id);
    ResponseUtil.success(res, tenant);
  };
  
  createTenant = async (req: Request<{id:string}>, res: Response) => {
    const { name } = req.body;
    const tenant = await this.tenantService.createTenant(name, (req as any).userId);
    ResponseUtil.created(res, tenant);
  };
  
  updateTenant = async (req: Request<{id:string}>, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const tenant = await this.tenantService.updateTenant(id, name, (req as any).userId);
    ResponseUtil.success(res, tenant);
  };
  
  getTenantStats = async (req: Request<{id:string}>, res: Response) => {
    const { id } = req.params;
    const stats = await this.tenantService.getTenantStats(id);
    ResponseUtil.success(res, stats);
  };
}