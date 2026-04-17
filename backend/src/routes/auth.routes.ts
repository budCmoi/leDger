import { Router } from 'express';
import passport from 'passport';

import {
  ensureGoogleAuthConfigured,
  getSession,
  handleGoogleCallbackSuccess,
  logout,
} from '../controllers/auth.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';

const authRouter = Router();

authRouter.get(
  '/google',
  ensureGoogleAuthConfigured,
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }),
);

authRouter.get(
  '/google/callback',
  ensureGoogleAuthConfigured,
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/',
  }),
  handleGoogleCallbackSuccess,
);

authRouter.get('/session', requireAuth, getSession);
authRouter.post('/logout', requireAuth, requireCsrf, logout);

export { authRouter };