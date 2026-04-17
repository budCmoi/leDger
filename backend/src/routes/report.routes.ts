import { Router } from 'express';

import { downloadReport, getAnnualReport, getMonthlyReport } from '../controllers/report.controller';
import { requireAuth } from '../middlewares/auth';

const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get('/monthly', getMonthlyReport);
reportRouter.get('/annual', getAnnualReport);
reportRouter.get('/download', downloadReport);

export { reportRouter };