import { Transaction } from '../models/Transaction';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';
import { mapTransaction } from '../utils/serializers';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listTransactions = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const filter: Record<string, unknown> = { user: req.user._id };
  const query = req.query as Record<string, string | undefined>;

  if (query.type) {
    filter.type = query.type;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.tag) {
    filter.tags = query.tag;
  }

  if (query.search) {
    const searchPattern = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ title: searchPattern }, { counterparty: searchPattern }, { notes: searchPattern }];
  }

  const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();
  res.json({ transactions: transactions.map((transaction) => mapTransaction(transaction)) });
});

export const getTransactionById = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const transaction = await Transaction.findOne({ _id: req.params.transactionId, user: req.user._id }).lean();

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  res.json({ transaction: mapTransaction(transaction) });
});

export const createTransaction = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const transaction = await Transaction.create({
    ...req.body,
    user: req.user._id,
  });

  res.status(201).json({ transaction: mapTransaction(transaction.toObject()) });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.transactionId, user: req.user._id },
    req.body,
    { new: true, runValidators: true },
  ).lean();

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  res.json({ transaction: mapTransaction(transaction) });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.transactionId,
    user: req.user._id,
  }).lean();

  if (!transaction) {
    throw new AppError(404, 'Transaction not found');
  }

  res.status(204).send();
});