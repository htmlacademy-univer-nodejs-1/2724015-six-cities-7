import { model, Schema } from 'mongoose';
import { User } from './user.type.js';

const userSchema = new Schema<User>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  avatar: { type: String, default: '' },
  password: { type: String, required: true },
  type: { type: String, default: 'regular' },
  favorites: [{ type: Schema.Types.ObjectId, ref: 'Offer' }],
}, { timestamps: true, collection: 'users' });

export const UserModel = model<User>('User', userSchema);
