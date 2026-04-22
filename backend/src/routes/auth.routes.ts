import { Router } from 'express';

import {
  createFirebaseSession,
  ensureFirebaseAuthConfigured,
  getSession,
  logout,
} from '../controllers/auth.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createFirebaseSessionSchema } from '../validators/auth.validators';

const authRouter = Router();

authRouter.post('/firebase/session', ensureFirebaseAuthConfigured, validate(createFirebaseSessionSchema), createFirebaseSession);

authRouter.get('/session', requireAuth, getSession);
authRouter.get('/bootstrap', requireAuth, getWorkspaceBootstrap);
authRouter.post('/logout', requireAuth, requireCsrf, logout);

export { authRouter };