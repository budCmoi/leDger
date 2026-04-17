import { Router } from 'express';

import { getDashboardSummary } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth';

const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, getDashboardSummary);

export { dashboardRouter };