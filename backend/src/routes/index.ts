import { Router } from 'express';

import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { dashboardRouter } from './dashboard.routes';
import { invoiceRouter } from './invoice.routes';
import { reportRouter } from './report.routes';
import { transactionRouter } from './transaction.routes';
import { userRouter } from './user.routes';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/transactions', transactionRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/admin-secret', adminRouter);

export { apiRouter };