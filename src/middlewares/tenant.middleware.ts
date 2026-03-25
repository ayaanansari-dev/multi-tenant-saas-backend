// src/middlewares/tenant.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ApiKeyService } from '../services/apiKey.service';
import { ResponseUtil } from '../utils/response.util';
import { ERROR_CODES } from '../constants/errors';
import { CustomRequest } from '../types/custom-request';

export const tenantMiddleware = (apiKeyService: ApiKeyService) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return ResponseUtil.error(
        res,
        ERROR_CODES.INVALID_API_KEY,
        'API key is required',
        401
      );
    }
    
    try {
      const keyData = await apiKeyService.validateKey(apiKey);
      
      if (!keyData) {
        return ResponseUtil.error(
          res,
          ERROR_CODES.INVALID_API_KEY,
          'Invalid API key',
          401
        );
      }
      
      // Cast to CustomRequest to set properties
      const customReq = req as CustomRequest;
      customReq.tenantId = keyData.tenantId;
      customReq.userId = keyData.userId;
      customReq.apiKeyId = keyData.id;
      customReq.userRole = keyData.user.role;
      
      next();
    } catch (error) {
      return ResponseUtil.error(
        res,
        ERROR_CODES.INTERNAL_ERROR,
        'Error validating API key',
        500
      );
    }
  };
};