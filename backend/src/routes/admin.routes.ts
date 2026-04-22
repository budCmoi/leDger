import { Router } from 'express';

import { createAdminUser, getAuditTrail, listUsers } from '../controllers/admin.controller';
import { requireAuth, requireCsrf, requireRole } from '../middlewares/auth';

const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/users', listUsers);
adminRouter.post('/users', requireCsrf, createAdminUser);
adminRouter.get('/audit-logs', getAuditTrail);

export { adminRouter };