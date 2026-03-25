import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const auditRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new AuditController(dependencies.auditService);
  const auth = authMiddleware(dependencies.userService);
  
  router.get('/', auth('audit:read'), controller.getAuditLogs);
  router.get('/verify', auth('audit:verify'), controller.verifyChain);
  
  return router;
};