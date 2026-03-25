import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKey.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

export const apiKeyRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new ApiKeyController(dependencies.apiKeyService);
  const auth = authMiddleware(dependencies.userService);
  
  router.get('/', auth('api_key:read'), controller.getApiKeys);
  router.post('/', auth('api_key:create'), controller.createApiKey);
  router.post('/:id/rotate', auth('api_key:rotate'), controller.rotateApiKey);
  router.delete('/:id', auth('api_key:delete'), controller.revokeApiKey);
  
  return router;
};