import type { Types } from 'mongoose';

import type { IUser } from '../../models/User';

declare global {
  namespace Express {
    interface User extends IUser {
      _id: Types.ObjectId;
      id: string;
      save: () => Promise<User>;
      toObject: () => Record<string, unknown>;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};