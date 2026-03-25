import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const metricsRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new MetricsController(dependencies.metricsService);
  const auth = authMiddleware(dependencies.userService);
  
  router.get('/tenant', auth('metrics:read'), controller.getTenantMetrics);
  router.get('/global', controller.getGlobalMetrics);
  
  return router;
};