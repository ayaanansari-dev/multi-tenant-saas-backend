import { Response } from 'express';
import { HTTP_STATUS } from '../constants';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    nextCursor?: string;
    hasMore?: boolean; 
  };
}

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    status: number = HTTP_STATUS.OK,
    metadata?: ApiResponse['metadata']
  ): Response {
    return res.status(status).json({
      success: true,
      data,
      metadata,
    });
  }
  
  static error(
    res: Response,
    code: string,
    message: string,
    status: number = HTTP_STATUS.BAD_REQUEST,
    details?: any
  ): Response {
    return res.status(status).json({
      success: false,
      error: {
        code,
        message,
        details,
      },
    });
  }
  
  static created<T>(res: Response, data: T): Response {
    return this.success(res, data, HTTP_STATUS.CREATED);
  }
  
  static noContent(res: Response): Response {
    return res.status(HTTP_STATUS.OK).json({ success: true });
  }
}