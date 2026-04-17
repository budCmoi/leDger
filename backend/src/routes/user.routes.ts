import { Router } from 'express';
import multer from 'multer';

import { getCurrentUser, updateCurrentUser, uploadAvatar } from '../controllers/user.controller';
import { requireAuth, requireCsrf } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema } from '../validators/user.validators';

const upload = multer({ storage: multer.memoryStorage() });
const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get('/me', getCurrentUser);
userRouter.patch('/me', requireCsrf, validate(updateProfileSchema), updateCurrentUser);
userRouter.post('/me/avatar', requireCsrf, upload.single('avatar'), uploadAvatar);

export { userRouter };