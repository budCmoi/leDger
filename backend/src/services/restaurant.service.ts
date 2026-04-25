import { Prisma, type ProductCategory, type UserRole } from '@prisma/client';

import { env } from '../config/env';
import { OUTPUT_TYPE_CODES, type OutputType } from '../constants/app';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/app-error';

const userSelect = {
  id: true,
  identifier: true,
  fullName: true,
  role: true,
  isActive: true,
} as const;

const productSelect = {
  id: true,
  name: true,
  unitPrice: true,
  category: true,
  isOrganic: true,
  unit: true,
  description: true,
  currentStock: true,
  minimumStock: true,
  createdAt: true,
  updatedAt: true,
} as const;

const purchaseInvoiceInclude = {
  createdBy: {
    select: userSelect,
  },
  items: {
    include: {
      product: {
        select: productSelect,
      },
    },
  },
} as const;

const outputInclude = {
  createdBy: {
    select: userSelect,
  },
  items: {
    include: {
      product: {
        select: productSelect,
      },
    },
  },
} as const;

const auditInclude = {
  actor: {
    select: userSelect,
  },
} as const;

type AuditLogInput = {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  description: string;
  payload?: Prisma.InputJsonValue;
  productId?: string;
  purchaseInvoiceId?: string;
  outputId?: string;
};

export type SessionUser = {
  id: string;
  identifier: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
};

export type ProductInput = {
  name: string;
  price: number;
  category: ProductCategory;
  isBio: boolean;
  unit: string;
  quantity: number;
  minimumStock: number;
  description?: string | null;
};

export type ProductUpdateInput = Partial<ProductInput>;

export type ProductInventoryType = ProductCategory | 'bio';

export type ProductListInput = {
  page: number;
  pageSize: number;
  search?: string;
  category?: ProductCategory;
  type?: ProductInventoryType;
  lowStock?: boolean;
};

export type StockAdjustmentInput = {
  newStock: number;
  reason: string;
};

export type PurchaseInvoiceInput = {
  reference: string;
  supplier: string;
  invoiceDate: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
};

export type OutputInput = {
  type: OutputType;
  notes?: string;
  estimatedRevenue?: number;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type AppUserInput = {
  identifier: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const serializeSessionUser = (user: SessionUser) => ({
  id: user.id,
  identifier: user.identifier,
  fullName: user.fullName,
  name: user.fullName,
  role: user.role,
  isActive: user.isActive,
});

const serializeProduct = (product: Prisma.ProductGetPayload<{ select: typeof productSelect }>) => {
  const productType = product.isOrganic ? 'bio' : product.category;

  return {
    id: product.id,
    name: product.name,
    price: product.unitPrice,
    unitPrice: product.unitPrice,
    category: product.category,
    isBio: product.isOrganic,
    isOrganic: product.isOrganic,
    type: productType,
    unit: product.unit,
    description: product.description,
    quantity: product.currentStock,
    currentStock: product.currentStock,
    minimumStock: product.minimumStock,
    inventoryValue: roundCurrency(product.currentStock * product.unitPrice),
    isLowStock: product.minimumStock > 0 && product.currentStock <= product.minimumStock,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
};

const serializePurchaseInvoice = (invoice: Prisma.PurchaseInvoiceGetPayload<{ include: typeof purchaseInvoiceInclude }>) => ({
  id: invoice.id,
  reference: invoice.reference,
  supplier: invoice.supplier,
  totalAmount: invoice.totalAmount,
  invoiceDate: invoice.invoiceDate.toISOString(),
  notes: invoice.notes,
  createdAt: invoice.createdAt.toISOString(),
  createdBy: serializeSessionUser(invoice.createdBy),
  items: invoice.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  })),
});

const serializeOutput = (output: Prisma.OutputGetPayload<{ include: typeof outputInclude }>) => ({
  id: output.id,
  type: output.type,
  typeCode: output.typeCode,
  notes: output.notes,
  estimatedRevenue: output.estimatedRevenue,
  totalCost: roundCurrency(output.items.reduce((sum, item) => sum + item.lineTotal, 0)),
  createdAt: output.createdAt.toISOString(),
  createdBy: serializeSessionUser(output.createdBy),
  items: output.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.product.name,
    quantity: item.quantity,
    unitCost: item.unitCost,
    lineTotal: item.lineTotal,
    remainingStock: item.product.currentStock,
  })),
});

const serializeAuditLog = (log: Prisma.AuditLogGetPayload<{ include: typeof auditInclude }>) => ({
  id: log.id,
  entityType: log.entityType,
  entityId: log.entityId,
  action: log.action,
  description: log.description,
  payload: log.payload,
  createdAt: log.createdAt.toISOString(),
  actor: serializeSessionUser(log.actor),
});

const getDayRange = (dateInput?: string) => {
  const baseDate = dateInput ? new Date(`${dateInput}T00:00:00`) : new Date();

  if (Number.isNaN(baseDate.getTime())) {
    throw new AppError(400, 'Invalid date format. Use YYYY-MM-DD.');
  }

  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
};

const createAuditLog = async (tx: Prisma.TransactionClient, input: AuditLogInput) => {
  await tx.auditLog.create({
    data: input,
  });
};

export const listProducts = async () => {
  const products = await prisma.product.findMany({
    select: productSelect,
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return products.map((product) => serializeProduct(product));
};

export const listProductsPage = async (input: ProductListInput) => {
  const where: Prisma.ProductWhereInput = {
    ...(input.search
      ? {
          OR: [
            {
              name: {
                contains: input.search,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: input.search,
                mode: 'insensitive',
              },
            },
          ],
        }
      : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.type === 'bio'
      ? { isOrganic: true }
      : input.type
        ? { category: input.type }
        : {}),
    ...(input.lowStock
      ? {
          minimumStock: {
            gt: 0,
          },
          currentStock: {
            lte: prisma.product.fields.minimumStock,
          },
        }
      : {}),
  };

  const skip = (input.page - 1) * input.pageSize;
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productSelect,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip,
      take: input.pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: products.map((product) => serializeProduct(product)),
    total,
    page: input.page,
    pageSize: input.pageSize,
    hasMore: skip + products.length < total,
  };
};

export const createProduct = async (actor: Express.User, input: ProductInput) => {
  const product = await prisma.$transaction(async (tx) => {
    const createdProduct = await tx.product.create({
      data: {
        name: input.name,
        unitPrice: roundCurrency(input.price),
        category: input.category,
        isOrganic: input.isBio,
        unit: input.unit,
        description: input.description ?? null,
        currentStock: input.quantity,
        minimumStock: input.minimumStock,
      },
      select: productSelect,
    });

    if (input.quantity > 0) {
      await tx.stockMovement.create({
        data: {
          productId: createdProduct.id,
          type: 'adjustment',
          quantityDelta: input.quantity,
          quantityBefore: 0,
          quantityAfter: input.quantity,
          reason: 'Initial stock creation',
          createdById: actor.id,
        },
      });
    }

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'product',
      entityId: createdProduct.id,
      action: 'create',
      description: `Created product ${createdProduct.name}`,
      productId: createdProduct.id,
      payload: input as Prisma.InputJsonValue,
    });

    return createdProduct;
  });

  return serializeProduct(product);
};

export const updateProduct = async (productId: string, actor: Express.User, input: ProductUpdateInput) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: productSelect,
  });

  if (!existingProduct) {
    throw new AppError(404, 'Product not found');
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id: productId },
      data: {
        name: input.name,
        unitPrice: input.price === undefined ? undefined : roundCurrency(input.price),
        category: input.category,
        isOrganic: input.isBio,
        unit: input.unit,
        description: input.description,
        currentStock: input.quantity,
        minimumStock: input.minimumStock,
      },
      select: productSelect,
    });

    if (input.quantity !== undefined && input.quantity !== existingProduct.currentStock) {
      await tx.stockMovement.create({
        data: {
          productId,
          type: 'adjustment',
          quantityDelta: roundCurrency(input.quantity - existingProduct.currentStock),
          quantityBefore: existingProduct.currentStock,
          quantityAfter: input.quantity,
          reason: 'Inline inventory edit',
          createdById: actor.id,
        },
      });
    }

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'product',
      entityId: product.id,
      action: 'update',
      description: `Updated product ${product.name}`,
      productId: product.id,
      payload: {
        before: existingProduct,
        after: product,
      } as Prisma.InputJsonValue,
    });

    return product;
  });

  return serializeProduct(updatedProduct);
};

export const deleteProduct = async (productId: string, actor: Express.User) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          invoiceItems: true,
          outputItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new AppError(404, 'Product not found');
  }

  if (product._count.invoiceItems > 0 || product._count.outputItems > 0) {
    throw new AppError(409, 'Product is referenced in inventory history and cannot be deleted');
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({
      where: { productId },
    });

    await tx.auditLog.deleteMany({
      where: { productId },
    });

    await tx.product.delete({
      where: { id: productId },
    });

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'product',
      entityId: productId,
      action: 'delete',
      description: `Deleted product ${product.name}`,
      payload: {
        productId,
        name: product.name,
      } as Prisma.InputJsonValue,
    });
  });
};

export const adjustProductStock = async (productId: string, actor: Express.User, input: StockAdjustmentInput) => {
  const updatedProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: productSelect,
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    const quantityBefore = product.currentStock;
    const quantityAfter = input.newStock;
    const quantityDelta = roundCurrency(quantityAfter - quantityBefore);

    const nextProduct = await tx.product.update({
      where: { id: productId },
      data: {
        currentStock: quantityAfter,
      },
      select: productSelect,
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: 'adjustment',
        quantityDelta,
        quantityBefore,
        quantityAfter,
        reason: input.reason,
        createdById: actor.id,
      },
    });

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'product',
      entityId: productId,
      action: 'adjust-stock',
      description: `Adjusted stock for ${product.name}`,
      productId,
      payload: {
        reason: input.reason,
        quantityBefore,
        quantityAfter,
      } as Prisma.InputJsonValue,
    });

    return nextProduct;
  });

  return serializeProduct(updatedProduct);
};

export const listPurchaseInvoices = async () => {
  const invoices = await prisma.purchaseInvoice.findMany({
    include: purchaseInvoiceInclude,
    orderBy: [{ invoiceDate: 'desc' }, { createdAt: 'desc' }],
  });

  return invoices.map((invoice) => serializePurchaseInvoice(invoice));
};

export const createPurchaseInvoice = async (actor: Express.User, input: PurchaseInvoiceInput) => {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: productSelect,
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products do not exist');
  }

  const productMap = new Map(products.map((product) => [product.id, product]));
  const lineItems = input.items.map((item) => ({
    ...item,
    lineTotal: roundCurrency(item.quantity * item.unitPrice),
  }));

  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.purchaseInvoice.create({
      data: {
        reference: input.reference,
        supplier: input.supplier,
        totalAmount: roundCurrency(lineItems.reduce((sum, item) => sum + item.lineTotal, 0)),
        invoiceDate: new Date(input.invoiceDate),
        notes: input.notes,
        createdById: actor.id,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: roundCurrency(item.unitPrice),
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: purchaseInvoiceInclude,
    });

    for (const item of lineItems) {
      const product = productMap.get(item.productId)!;
      const quantityAfter = roundCurrency(product.currentStock + item.quantity);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: quantityAfter,
          unitPrice: roundCurrency(item.unitPrice),
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'purchase',
          quantityDelta: item.quantity,
          quantityBefore: product.currentStock,
          quantityAfter,
          reason: `Purchase invoice ${input.reference}`,
          createdById: actor.id,
          purchaseInvoiceId: createdInvoice.id,
        },
      });

      productMap.set(item.productId, {
        ...product,
        currentStock: quantityAfter,
        unitPrice: roundCurrency(item.unitPrice),
      });
    }

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'purchase-invoice',
      entityId: createdInvoice.id,
      action: 'create',
      description: `Created purchase invoice ${createdInvoice.reference}`,
      purchaseInvoiceId: createdInvoice.id,
      payload: input as Prisma.InputJsonValue,
    });

    return createdInvoice;
  });

  return serializePurchaseInvoice(invoice);
};

export const listOutputs = async () => {
  const outputs = await prisma.output.findMany({
    include: outputInclude,
    orderBy: [{ createdAt: 'desc' }],
  });

  return outputs.map((output) => serializeOutput(output));
};

export const createOutput = async (actor: Express.User, input: OutputInput) => {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: productSelect,
  });

  if (products.length !== productIds.length) {
    throw new AppError(400, 'One or more products do not exist');
  }

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of input.items) {
    const product = productMap.get(item.productId)!;

    if (item.quantity > product.currentStock) {
      throw new AppError(409, `Insufficient stock for ${product.name}`);
    }
  }

  const lineItems = input.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      ...item,
      unitCost: product.unitPrice,
      lineTotal: roundCurrency(item.quantity * product.unitPrice),
    };
  });

  const { start, end } = getDayRange();

  const output = await prisma.$transaction(async (tx) => {
    const revenueUsedToday =
      (await tx.output.aggregate({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
        _sum: {
          estimatedRevenue: true,
        },
      }))._sum.estimatedRevenue ?? 0;

    const totalCost = roundCurrency(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
    const remainingRevenueCap = Math.max(env.DAILY_REVENUE_CAP - revenueUsedToday, 0);
    const estimatedRevenue = roundCurrency(
      input.estimatedRevenue ?? Math.min(remainingRevenueCap, totalCost * env.OUTPUT_REVENUE_MULTIPLIER),
    );

    const createdOutput = await tx.output.create({
      data: {
        type: input.type,
        typeCode: OUTPUT_TYPE_CODES[input.type],
        notes: input.notes,
        estimatedRevenue,
        createdById: actor.id,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: outputInclude,
    });

    for (const item of lineItems) {
      const product = productMap.get(item.productId)!;
      const quantityAfter = roundCurrency(product.currentStock - item.quantity);

      await tx.product.update({
        where: { id: item.productId },
        data: {
          currentStock: quantityAfter,
        },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'consumption',
          quantityDelta: -item.quantity,
          quantityBefore: product.currentStock,
          quantityAfter,
          reason: `Output ${createdOutput.type}`,
          createdById: actor.id,
          outputId: createdOutput.id,
        },
      });

      productMap.set(item.productId, {
        ...product,
        currentStock: quantityAfter,
      });
    }

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'output',
      entityId: createdOutput.id,
      action: 'create',
      description: `Recorded ${createdOutput.type} output`,
      outputId: createdOutput.id,
      payload: input as Prisma.InputJsonValue,
    });

    return createdOutput;
  });

  return serializeOutput(output);
};

export const getDashboardSnapshot = async () => {
  const [products, invoices, outputs, outputItems, todayOutputs] = await Promise.all([
    prisma.product.findMany({ select: productSelect, orderBy: { name: 'asc' } }),
    prisma.purchaseInvoice.findMany({ include: purchaseInvoiceInclude, orderBy: { invoiceDate: 'desc' }, take: 5 }),
    prisma.output.findMany({ include: outputInclude, orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.outputItem.findMany(),
    prisma.output.findMany({
      include: outputInclude,
      where: {
        createdAt: {
          gte: getDayRange().start,
          lt: getDayRange().end,
        },
      },
    }),
  ]);

  const totalInvoices = roundCurrency(invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0));
  const inventoryValue = roundCurrency(products.reduce((sum, product) => sum + product.currentStock * product.unitPrice, 0));
  const totalOutputCost = roundCurrency(outputItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const estimatedRevenue = roundCurrency(todayOutputs.reduce((sum, output) => sum + output.estimatedRevenue, 0));
  const estimatedGain = Math.max(roundCurrency(estimatedRevenue - totalOutputCost), 0);
  const estimatedLoss = Math.max(roundCurrency(totalOutputCost - estimatedRevenue), 0);
  const dailyRevenueUsed = roundCurrency(todayOutputs.reduce((sum, output) => sum + output.estimatedRevenue, 0));

  const outputBreakdown = Object.entries(OUTPUT_TYPE_CODES).map(([type, typeCode]) => {
    const matchingOutputs = todayOutputs.filter((output) => output.type === type);
    const totalCost = roundCurrency(
      matchingOutputs.reduce(
        (sum, output) => sum + output.items.reduce((itemSum, item) => itemSum + item.lineTotal, 0),
        0,
      ),
    );

    return {
      type,
      typeCode,
      count: matchingOutputs.length,
      totalCost,
      estimatedRevenue: roundCurrency(matchingOutputs.reduce((sum, output) => sum + output.estimatedRevenue, 0)),
    };
  });

  const categoryStockValue = ['fresh', 'frozen', 'dry'].map((category) => ({
    label: category,
    value: roundCurrency(
      products
        .filter((product) => product.category === category)
        .reduce((sum, product) => sum + product.currentStock * product.unitPrice, 0),
    ),
  }));

  return {
    metrics: {
      totalInvoices,
      inventoryValue,
      totalOutputCost,
      estimatedRevenue,
      estimatedGain,
      estimatedLoss,
      dailyRevenueCap: env.DAILY_REVENUE_CAP,
      dailyRevenueUsed,
    },
    lowStockProducts: products
      .filter((product) => product.minimumStock > 0 && product.currentStock <= product.minimumStock)
      .map((product) => serializeProduct(product)),
    recentInvoices: invoices.map((invoice) => serializePurchaseInvoice(invoice)),
    recentOutputs: outputs.map((output) => serializeOutput(output)),
    outputBreakdown,
    categoryStockValue,
  };
};

export const getDailyJournal = async (dateInput?: string) => {
  const { start, end } = getDayRange(dateInput);
  const outputs = await prisma.output.findMany({
    include: outputInclude,
    where: {
      createdAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const entries = outputs.map((output) => serializeOutput(output));
  const groupedByType = Object.entries(OUTPUT_TYPE_CODES).map(([type, typeCode]) => {
    const matchingEntries = entries.filter((entry) => entry.type === type);

    return {
      type,
      typeCode,
      count: matchingEntries.length,
      totalCost: roundCurrency(matchingEntries.reduce((sum, entry) => sum + entry.totalCost, 0)),
      estimatedRevenue: roundCurrency(matchingEntries.reduce((sum, entry) => sum + entry.estimatedRevenue, 0)),
      entries: matchingEntries,
    };
  });

  const totalCost = roundCurrency(entries.reduce((sum, entry) => sum + entry.totalCost, 0));
  const estimatedRevenue = roundCurrency(entries.reduce((sum, entry) => sum + entry.estimatedRevenue, 0));

  return {
    date: start.toISOString().slice(0, 10),
    totals: {
      outputsCount: entries.length,
      totalCost,
      estimatedRevenue,
      estimatedGain: Math.max(roundCurrency(estimatedRevenue - totalCost), 0),
      estimatedLoss: Math.max(roundCurrency(totalCost - estimatedRevenue), 0),
    },
    groupedByType,
    entries,
  };
};

export const listAuditLogs = async () => {
  const logs = await prisma.auditLog.findMany({
    include: auditInclude,
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  return logs.map((log) => serializeAuditLog(log));
};

export const listAppUsers = async () => {
  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });

  return users.map((user) => serializeSessionUser(user));
};

export const createAppUser = async (actor: Express.User, input: AppUserInput) => {
  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: input,
      select: userSelect,
    });

    await createAuditLog(tx, {
      actorId: actor.id,
      entityType: 'user',
      entityId: createdUser.id,
      action: 'create',
      description: `Created user ${createdUser.identifier}`,
      payload: {
        identifier: createdUser.identifier,
        fullName: createdUser.fullName,
        role: createdUser.role,
      } as Prisma.InputJsonValue,
    });

    return createdUser;
  });

  return serializeSessionUser(user);
};

export const loadRestaurantBootstrap = async (user: Express.User) => {
  const [dashboard, products, purchaseInvoices, outputs, journal, auditLogs, users] = await Promise.all([
    getDashboardSnapshot(),
    listProducts(),
    listPurchaseInvoices(),
    listOutputs(),
    getDailyJournal(),
    user.role === 'admin' ? listAuditLogs() : Promise.resolve([]),
    user.role === 'admin' ? listAppUsers() : Promise.resolve([]),
  ]);

  return {
    session: {
      user: serializeSessionUser({
        id: user.id,
        identifier: user.identifier,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
      }),
    },
    dashboard,
    products,
    purchaseInvoices,
    outputs,
    journal,
    auditLogs,
    users,
  };
};