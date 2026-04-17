import { Schema, model } from 'mongoose';

import { DEFAULT_CURRENCY, USER_ROLES, type UserRole } from '../constants/app';

export interface IUser {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
  companyName: string;
  role: UserRole;
  currency: string;
}

const userSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled company',
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'user',
    },
    currency: {
      type: String,
      default: DEFAULT_CURRENCY,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>('User', userSchema);