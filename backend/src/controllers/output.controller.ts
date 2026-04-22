import { z } from 'zod';

import { OUTPUT_TYPES } from '../constants/app';
import { createOutput, listOutputs } from '../services/restaurant.service';
import { broadcastDashboardUpdate, broadcastInventoryUpdate, broadcastJournalUpdate } from '../services/realtime.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

const outputSchema = z.object({
  type: z.enum(OUTPUT_TYPES),
  notes: z.string().trim().optional(),
  estimatedRevenue: z.coerce.number().nonnegative().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
      }),
    )
    .min(1),
});

export const getOutputs = asyncHandler(async (_req, res) => {
  res.json({ outputs: await listOutputs() });
});

export const createInventoryOutput = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const output = await createOutput(req.user, outputSchema.parse(req.body));
  broadcastInventoryUpdate();
  broadcastDashboardUpdate();
  broadcastJournalUpdate();
  res.status(201).json({ output });
});