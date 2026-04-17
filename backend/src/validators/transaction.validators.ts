import { z } from 'zod';

import { TRANSACTION_CATEGORIES, TRANSACTION_TYPES } from '../constants/app';

const tagSchema = z.string().min(1).max(24);

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  title: z.string().min(2).max(120),
  amount: z.coerce.number().positive(),
  currency: z.string().min(3).max(5).default('USD'),
  category: z.enum(TRANSACTION_CATEGORIES),
  tags: z.array(tagSchema).max(8).default([]),
  counterparty: z.string().max(120).optional(),
  date: z.coerce.date(),
  notes: z.string().max(400).optional(),
  status: z.enum(['pending', 'cleared']).default('cleared'),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  type: z.enum(TRANSACTION_TYPES).optional(),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  search: z.string().optional(),
  tag: z.string().optional(),
});