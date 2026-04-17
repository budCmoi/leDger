import { Schema, model } from 'mongoose';

import { DEFAULT_CURRENCY, USER_ROLES, type UserRole } from '../constants/app';

export interface IUser {
  firebaseUid: string;
  email: string;
  emailVerified: boolean;
  name: string;
  avatar?: string;
  companyName: string;
  role: UserRole;
  currency: string;
  lastLoginAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    firebaseUid: {
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
    emailVerified: {
      type: Boolean,
      required: true,
      default: true,
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
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model<IUser>('User', userSchema);