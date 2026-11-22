import { Schema, model } from 'mongoose';

export enum UserType { Regular = 'regular', Pro = 'pro' }

export interface UserEntity {
  name: string;
  email: string;
  avatar: string;
  passwordHash: string;
  type: UserType;
}

const userSchema = new Schema<UserEntity>({
  name: String,
  email: { type: String, unique: true },
  avatar: { type: String, default: 'default-avatar.png' },
  passwordHash: { type: String, select: false },
  type: String,
}, { toJSON: { transform: (_document, result) => {
  Reflect.deleteProperty(result, 'passwordHash');
  return result;
} } });

export const UserModel = model<UserEntity>('User', userSchema);
