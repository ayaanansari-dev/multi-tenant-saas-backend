import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const tenantRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new TenantController(dependencies.tenantService);
  const auth = authMiddleware(dependencies.userService);
  
  router.get('/:id', auth(), controller.getTenant);
  router.post('/', auth(), controller.createTenant);
  router.put('/:id', auth(), controller.updateTenant);
  router.get('/:id/stats', auth('metrics:read'), controller.getTenantStats);
  
  return router;
};