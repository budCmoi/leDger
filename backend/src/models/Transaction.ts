import { Schema, Types, model } from 'mongoose';

import {
  DEFAULT_CURRENCY,
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  type TransactionCategory,
  type TransactionType,
} from '../constants/app';

export interface ITransaction {
  user: Types.ObjectId;
  type: TransactionType;
  title: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
  tags: string[];
  counterparty?: string;
  date: Date;
  notes?: string;
  status: 'pending' | 'cleared';
}

const transactionSchema = new Schema<ITransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: TRANSACTION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      trim: true,
    },
    category: {
      type: String,
      enum: TRANSACTION_CATEGORIES,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    counterparty: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'cleared'],
      default: 'cleared',
    },
  },
  {
    timestamps: true,
  },
);

export const Transaction = model<ITransaction>('Transaction', transactionSchema);