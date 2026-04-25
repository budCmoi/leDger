import { Router } from 'express';

import {
  adjustInventoryProductStock,
  createInventoryProduct,
  deleteInventoryProduct,
  getProducts,
  patchInventoryProduct,
} from '../controllers/product.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';

const productsRouter = Router();

productsRouter.use(requireAuth);
productsRouter.get('/', getProducts);
productsRouter.post('/', requireCsrf, createInventoryProduct);
productsRouter.patch('/:productId', requireCsrf, patchInventoryProduct);
productsRouter.delete('/:productId', requireCsrf, deleteInventoryProduct);
productsRouter.post('/:productId/stock-adjustments', requireCsrf, adjustInventoryProductStock);

export { productsRouter };