import { Router } from 'express';
import { userRoutes } from './user.routes';
import { apiKeyRoutes } from './apiKey.routes';
import { auditRoutes } from './audit.routes';
import { healthRoutes } from './health.routes';
import { metricsRoutes } from './metrics.routes';
import { tenantRoutes } from './tenant.routes';

export const createRouter = (
  dependencies: any
): Router => {
  const router = Router();
  
  router.use('/tenants', tenantRoutes(dependencies));
  router.use('/users', userRoutes(dependencies));
  router.use('/api-keys', apiKeyRoutes(dependencies));
  router.use('/audit', auditRoutes(dependencies));
  router.use('/health', healthRoutes(dependencies));
  router.use('/metrics', metricsRoutes(dependencies));
  
  return router;
};