import { getDailyJournal } from '../services/restaurant.service';
import { asyncHandler } from '../utils/async-handler';

export const getDailyOperationsJournal = asyncHandler(async (req, res) => {
  const date = typeof req.query.date === 'string' ? req.query.date : undefined;
  res.json({ journal: await getDailyJournal(date) });
});