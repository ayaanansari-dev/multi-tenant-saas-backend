// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response.util';
import { ERROR_CODES } from '../constants/errors';
import { CustomRequest } from '../types/custom-request';

export const authMiddleware = (userService: UserService) => {
  return (requiredPermission?: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      const customReq = req as CustomRequest;
      
      if (!customReq.userId) {
        return ResponseUtil.error(
          res,
          ERROR_CODES.INVALID_API_KEY,
          'Authentication required',
          401
        );
      }
      
      if (requiredPermission) {
        const hasPermission = await userService.checkPermission(
          customReq.userId,
          requiredPermission
        );
        
        if (!hasPermission) {
          return ResponseUtil.error(
            res,
            ERROR_CODES.INSUFFICIENT_PERMISSIONS,
            'Insufficient permissions',
            403
          );
        }
      }
      
      next();
    };
  };
};