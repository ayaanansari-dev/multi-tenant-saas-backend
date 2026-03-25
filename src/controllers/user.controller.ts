import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { ResponseUtil } from '../utils/response.util';
import { getPaginationParams } from '../utils/pagination.util';

export class UserController {
  constructor(private userService: UserService) {}
  
  getUsers = async (req: Request, res: Response) => {
    const { skip, take, cursor, role } = req.query;
    const users = await this.userService.getUsers({
      skip: skip ? parseInt(skip as string) : undefined,
      take: take ? parseInt(take as string) : undefined,
      cursor: cursor as string,
      role: role as string,
    });
    ResponseUtil.success(res, users);
  };
  
  getUser = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);
    ResponseUtil.success(res, user);
  };
  
  createUser = async (req: Request, res: Response) => {
    const user = await this.userService.createUser({
      ...req.body,
      tenantId: (req as any).tenantId,
      invitedBy: (req as any).userId,
      apiKeyId: (req as any).apiKeyId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    ResponseUtil.created(res, user);
  };
  
  updateUser = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.updateUser(id, req.body, (req as any).userId, (req as any).apiKeyId);
    ResponseUtil.success(res, user);
  };
  
  deleteUser = async (req: Request<{ id: string }>, res: Response) => {
    const { id } = req.params;
    await this.userService.deleteUser(id, (req as any).userId, (req as any).apiKeyId);
    ResponseUtil.noContent(res);
  };
}