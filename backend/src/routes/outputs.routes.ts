import { Router } from 'express';

import { createInventoryOutput, getOutputs } from '../controllers/output.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';

const outputsRouter = Router();

outputsRouter.use(requireAuth);
outputsRouter.get('/', getOutputs);
outputsRouter.post('/', requireCsrf, createInventoryOutput);

export { outputsRouter };