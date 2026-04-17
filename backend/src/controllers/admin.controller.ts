import { Invoice } from '../models/Invoice';
import { Transaction } from '../models/Transaction';
import { User } from '../models/User';
import { asyncHandler } from '../utils/async-handler';
import { mapTransaction, mapUser } from '../utils/serializers';

export const getAdminOverview = asyncHandler(async (_req, res) => {
  const [users, transactions, invoices] = await Promise.all([
    User.find().lean(),
    Transaction.find().sort({ date: -1 }).lean(),
    Invoice.find().lean(),
  ]);

  const revenue = transactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  res.json({
    stats: {
      users: users.length,
      transactions: transactions.length,
      invoices: invoices.length,
      revenue,
      expenses,
      profit: revenue - expenses,
    },
    userRoles: users.reduce<Record<string, number>>((accumulator, user) => {
      accumulator[user.role] = (accumulator[user.role] ?? 0) + 1;
      return accumulator;
    }, {}),
    recentTransactions: transactions.slice(0, 10).map((transaction) => mapTransaction(transaction)),
  });
});

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json({ users: users.map((user) => mapUser(user)) });
});

export const listPlatformTransactions = asyncHandler(async (_req, res) => {
  const transactions = await Transaction.find().sort({ date: -1 }).limit(100).populate('user', 'name email companyName').lean();

  res.json({
    transactions: transactions.map((transaction) => ({
      ...mapTransaction(transaction),
      user: transaction.user,
    })),
  });
});

export const deleteUser = asyncHandler(async (req, res) => {
  await Promise.all([
    Transaction.deleteMany({ user: req.params.userId }),
    Invoice.deleteMany({ user: req.params.userId }),
    User.findByIdAndDelete(req.params.userId),
  ]);

  res.status(204).send();
});