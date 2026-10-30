import { Types } from 'mongoose';

export type User = {
  name: string;
  email: string;
  avatar: string;
  password: string;
  type: string;
  favorites: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUser = Omit<User, 'createdAt' | 'updatedAt' | 'favorites'>;
