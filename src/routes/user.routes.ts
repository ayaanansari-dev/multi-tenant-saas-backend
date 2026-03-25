import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { auditMiddleware } from '../middlewares/audit.middleware';

export const userRoutes = (dependencies: any): Router => {
  const router = Router();
  const controller = new UserController(dependencies.userService);
  const auth = authMiddleware(dependencies.userService);
  const audit = auditMiddleware(dependencies.auditService);
  
  router.get('/', auth('user:read'), controller.getUsers);
  router.get('/:id', auth('user:read'), controller.getUser);
  router.post('/', auth('user:create'), audit('User'), controller.createUser);
  router.put('/:id', auth('user:update'), audit('User'), controller.updateUser);
  router.delete('/:id', auth('user:delete'), audit('User'), controller.deleteUser);
  
  return router;
};