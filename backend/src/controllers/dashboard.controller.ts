import { buildDashboardSummary } from '../services/dashboard.service';
import { getDashboardSnapshot } from '../services/restaurant.service';
import { AppError } from '../utils/app-error';
import { asyncHandler } from '../utils/async-handler';

export const getDashboardSummary = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const summary = await getDashboardSnapshot();
  res.json(summary);
});