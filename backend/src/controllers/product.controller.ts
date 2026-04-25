import { z } from 'zod';

import { PRODUCT_CATEGORIES } from '../constants/app';
import {
  adjustProductStock,
  createProduct,
  deleteProduct,
  listProductsPage,
  updateProduct,
} from '../services/restaurant.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

const PRODUCT_TYPES = [...PRODUCT_CATEGORIES, 'bio'] as const;

const pickValue = (value: unknown) => Array.isArray(value) ? value[0] : value;

const productSchema = z.object({
  name: z.string().trim().min(2),
  price: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  category: z.enum(PRODUCT_CATEGORIES),
  isBio: z.boolean().optional(),
  isOrganic: z.boolean().optional(),
  unit: z.string().trim().min(1).default('kg'),
  quantity: z.coerce.number().nonnegative().optional(),
  currentStock: z.coerce.number().nonnegative().optional(),
  minimumStock: z.coerce.number().nonnegative(),
  description: z.string().trim().max(500).optional(),
}).superRefine((value, ctx) => {
  if (value.price === undefined && value.unitPrice === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Price is required',
      path: ['price'],
    });
  }

  if (value.quantity === undefined && value.currentStock === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Quantity is required',
      path: ['quantity'],
    });
  }
}).transform((value) => ({
  name: value.name,
  price: value.price ?? value.unitPrice ?? 0,
  category: value.category,
  isBio: value.isBio ?? value.isOrganic ?? false,
  unit: value.unit,
  quantity: value.quantity ?? value.currentStock ?? 0,
  minimumStock: value.minimumStock,
  description: value.description?.trim() ? value.description.trim() : null,
}));

const productUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  price: z.coerce.number().nonnegative().optional(),
  unitPrice: z.coerce.number().nonnegative().optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  isBio: z.boolean().optional(),
  isOrganic: z.boolean().optional(),
  unit: z.string().trim().min(1).optional(),
  quantity: z.coerce.number().nonnegative().optional(),
  currentStock: z.coerce.number().nonnegative().optional(),
  minimumStock: z.coerce.number().nonnegative().optional(),
  description: z.string().trim().max(500).optional(),
}).refine((value) => Object.keys(value).length > 0).transform((value) => ({
  ...(value.name === undefined ? {} : { name: value.name }),
  ...(value.price === undefined && value.unitPrice === undefined ? {} : { price: value.price ?? value.unitPrice ?? 0 }),
  ...(value.category === undefined ? {} : { category: value.category }),
  ...(value.isBio === undefined && value.isOrganic === undefined ? {} : { isBio: value.isBio ?? value.isOrganic ?? false }),
  ...(value.unit === undefined ? {} : { unit: value.unit }),
  ...(value.quantity === undefined && value.currentStock === undefined ? {} : { quantity: value.quantity ?? value.currentStock ?? 0 }),
  ...(value.minimumStock === undefined ? {} : { minimumStock: value.minimumStock }),
  ...(value.description === undefined ? {} : { description: value.description.trim() ? value.description.trim() : null }),
}));

const productListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(120),
  search: z.string().trim().min(1).optional(),
  category: z.enum(PRODUCT_CATEGORIES).optional(),
  type: z.enum(PRODUCT_TYPES).optional(),
  lowStock: z.enum(['true', 'false']).optional().transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value === 'true';
  }),
});

const stockAdjustmentSchema = z.object({
  newStock: z.coerce.number().nonnegative(),
  reason: z.string().min(4),
});

export const getProducts = asyncHandler(async (req, res) => {
  const query = productListQuerySchema.parse({
    page: pickValue(req.query.page),
    pageSize: pickValue(req.query.pageSize),
    search: pickValue(req.query.search),
    category: pickValue(req.query.category),
    type: pickValue(req.query.type),
    lowStock: pickValue(req.query.lowStock),
  });

  res.json(await listProductsPage(query));
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

export const deleteInventoryProduct = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
  await deleteProduct(productId, req.user);
  res.status(204).send();
});