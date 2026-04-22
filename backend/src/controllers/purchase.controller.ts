import { z } from 'zod';

import { createPurchaseInvoice, listPurchaseInvoices } from '../services/restaurant.service';
import { broadcastDashboardUpdate, broadcastInventoryUpdate } from '../services/realtime.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

const purchaseInvoiceSchema = z.object({
  reference: z.string().min(2),
  supplier: z.string().min(2),
  invoiceDate: z.string().min(10),
  notes: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().positive(),
        unitPrice: z.coerce.number().nonnegative(),
      }),
    )
    .min(1),
});

export const getPurchaseInvoices = asyncHandler(async (_req, res) => {
  res.json({ purchaseInvoices: await listPurchaseInvoices() });
});

export const createInventoryPurchaseInvoice = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const purchaseInvoice = await createPurchaseInvoice(req.user, purchaseInvoiceSchema.parse(req.body));
  broadcastInventoryUpdate();
  broadcastDashboardUpdate();
  res.status(201).json({ purchaseInvoice });
});