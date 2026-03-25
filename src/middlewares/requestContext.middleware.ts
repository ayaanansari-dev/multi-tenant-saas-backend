import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export const requestContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-Id', req.requestId);
  
  next();
};