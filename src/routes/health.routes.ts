import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';

export const healthRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new HealthController(dependencies.queueManager);
  
  router.get('/', controller.check);
  router.get('/ready', controller.check);
  router.get('/live', controller.check);
  
  return router;
};