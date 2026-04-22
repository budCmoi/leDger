import { CSRF_TOKEN_COOKIE } from '../constants/app';
import { loadRestaurantBootstrap } from '../services/restaurant.service';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';

export const getRestaurantBootstrap = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const payload = await loadRestaurantBootstrap(req.user);

  res.json({
    ...payload,
    session: {
      ...payload.session,
      csrfToken: req.cookies[CSRF_TOKEN_COOKIE] ?? null,
    },
  });
});