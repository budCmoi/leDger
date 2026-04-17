import { Router } from 'express';

import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  updateInvoice,
  updateInvoiceStatus,
} from '../controllers/invoice.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createInvoiceSchema,
  invoiceQuerySchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from '../validators/invoice.validators';

const invoiceRouter = Router();

invoiceRouter.use(requireAuth);

invoiceRouter.get('/', validate(invoiceQuerySchema, 'query'), listInvoices);
invoiceRouter.get('/:invoiceId', getInvoiceById);
invoiceRouter.post('/', requireCsrf, validate(createInvoiceSchema), createInvoice);
invoiceRouter.patch('/:invoiceId', requireCsrf, validate(updateInvoiceSchema), updateInvoice);
invoiceRouter.patch('/:invoiceId/status', requireCsrf, validate(updateInvoiceStatusSchema), updateInvoiceStatus);
invoiceRouter.delete('/:invoiceId', requireCsrf, deleteInvoice);

export { invoiceRouter };