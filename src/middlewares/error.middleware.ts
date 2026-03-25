// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../config/logger';
import { ResponseUtil } from '../utils/response.util';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/errors';
import { HTTP_STATUS } from '../constants';
import { CustomRequest } from '../types/custom-request';

export const errorMiddleware = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Cast to CustomRequest to access requestId
  const customReq = req as CustomRequest;
  
  Logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    requestId: customReq.requestId,
    path: req.path,
    method: req.method,
  });
  
  // Handle known error types
  if (error.code === 'P2002') {
    return ResponseUtil.error(
      res,
      ERROR_CODES.RESOURCE_ALREADY_EXISTS,
      'Resource already exists',
      HTTP_STATUS.BAD_REQUEST
    );
  }
  
  if (error.code === 'P2025') {
    return ResponseUtil.error(
      res,
      ERROR_CODES.RESOURCE_NOT_FOUND,
      ERROR_MESSAGES.RESOURCE_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }
  
  if (error.message === 'Tenant isolation violation') {
    return ResponseUtil.error(
      res,
      ERROR_CODES.TENANT_ISOLATION_VIOLATION,
      ERROR_MESSAGES.TENANT_ISOLATION_VIOLATION,
      HTTP_STATUS.FORBIDDEN
    );
  }
  
  // Default error response
  const status = error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = error.code || ERROR_CODES.INTERNAL_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;
  
  ResponseUtil.error(res, code, message, status);
};