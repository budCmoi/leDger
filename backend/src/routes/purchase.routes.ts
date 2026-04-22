import { Router } from 'express';

import { createInventoryPurchaseInvoice, getPurchaseInvoices } from '../controllers/purchase.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';

const purchaseRouter = Router();

purchaseRouter.use(requireAuth);
purchaseRouter.get('/', getPurchaseInvoices);
purchaseRouter.post('/', requireCsrf, createInventoryPurchaseInvoice);

export { purchaseRouter };