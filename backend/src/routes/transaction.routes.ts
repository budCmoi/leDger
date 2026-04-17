import { Router } from 'express';

import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  updateTransaction,
} from '../controllers/transaction.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import {
  createTransactionSchema,
  transactionQuerySchema,
  updateTransactionSchema,
} from '../validators/transaction.validators';

const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.get('/', validate(transactionQuerySchema, 'query'), listTransactions);
transactionRouter.get('/:transactionId', getTransactionById);
transactionRouter.post('/', requireCsrf, validate(createTransactionSchema), createTransaction);
transactionRouter.patch('/:transactionId', requireCsrf, validate(updateTransactionSchema), updateTransaction);
transactionRouter.delete('/:transactionId', requireCsrf, deleteTransaction);

export { transactionRouter };