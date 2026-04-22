import { Router } from 'express';

import { getDailyOperationsJournal } from '../controllers/journal.controller';
import { requireAuth } from '../middlewares/auth';

const journalRouter = Router();

journalRouter.use(requireAuth);
journalRouter.get('/daily', getDailyOperationsJournal);

export { journalRouter };