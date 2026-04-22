import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '../constants/app';
import { createProduct, adjustProductStock, listProducts, updateProduct } from '../services/restaurant.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

const productSchema = z.object({
  name: z.string().min(2),
  unitPrice: z.coerce.number().nonnegative(),
  category: z.enum(PRODUCT_CATEGORIES),
  isOrganic: z.boolean().default(false),
  unit: z.string().min(1).default('kg'),
  currentStock: z.coerce.number().nonnegative(),
  minimumStock: z.coerce.number().nonnegative(),
});

const productUpdateSchema = productSchema.omit({ currentStock: true }).partial().refine((value) => Object.keys(value).length > 0);

const stockAdjustmentSchema = z.object({
  newStock: z.coerce.number().nonnegative(),
  reason: z.string().min(4),
});

export const getProducts = asyncHandler(async (_req, res) => {
  res.json({ products: await listProducts() });
});

export const createInventoryProduct = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const product = await createProduct(req.user, productSchema.parse(req.body));
  res.status(201).json({ product });
});

export const patchInventoryProduct = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const product = await updateProduct(productId, req.user, productUpdateSchema.parse(req.body));
  res.json({ product });
});

export const adjustInventoryProductStock = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  const product = await adjustProductStock(productId, req.user, stockAdjustmentSchema.parse(req.body));
  res.json({ product });
});