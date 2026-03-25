import { Request, Response } from 'express';
import { ApiKeyService } from '../services/apiKey.service';
import { ResponseUtil } from '../utils/response.util';

export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}
  
  createApiKey = async (req: Request, res: Response) => {
    const { name } = req.body;
    const { apiKey, plainKey } = await this.apiKeyService.createKey(
        (req as any).userId,
      name,
      (req as any).tenantId
    );
    ResponseUtil.created(res, { ...apiKey, plainKey });
  };
  
  getApiKeys = async (req: Request, res: Response) => {
    const keys = await this.apiKeyService.getUserKeys((req as any).userId);
    ResponseUtil.success(res, keys);
  };
  
  rotateApiKey = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const result = await this.apiKeyService.rotateKey(id, (req as any).userId);
    ResponseUtil.success(res, result);
  };
  
  revokeApiKey = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    await this.apiKeyService.revokeKey(id, (req as any).userId);
    ResponseUtil.noContent(res);
  };
}