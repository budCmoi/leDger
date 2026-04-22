import { Router } from 'express';

import { getRestaurantBootstrap } from '../controllers/bootstrap.controller';
import { requireAuth } from '../middlewares/auth';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { dashboardRouter } from './dashboard.routes';
import { journalRouter } from './journal.routes';
import { outputsRouter } from './outputs.routes';
import { productsRouter } from './products.routes';
import { purchaseRouter } from './purchase.routes';

const apiRouter = Router();

apiRouter.get('/bootstrap', requireAuth, getRestaurantBootstrap);
apiRouter.use('/auth', authRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/purchase-invoices', purchaseRouter);
apiRouter.use('/outputs', outputsRouter);
apiRouter.use('/journal', journalRouter);
apiRouter.use('/admin', adminRouter);

export { apiRouter };