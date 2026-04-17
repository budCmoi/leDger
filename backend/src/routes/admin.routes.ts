import { Router } from 'express';

import {
  deleteUser,
  getAdminOverview,
  listPlatformTransactions,
  listUsers,
} from '../controllers/admin.controller';
import { requireAuth, requireCsrf, requireRole } from '../middlewares/auth';

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/overview', getAdminOverview);
adminRouter.get('/users', listUsers);
adminRouter.get('/transactions', listPlatformTransactions);
adminRouter.delete('/users/:userId', requireCsrf, deleteUser);

export { adminRouter };