import { HydratedDocument } from 'mongoose';
import { CreateUser, User } from './user.type.js';

export interface UserService {
  findById(id: string): Promise<HydratedDocument<User> | null>;
  findByEmail(email: string): Promise<HydratedDocument<User> | null>;
  create(data: CreateUser): Promise<HydratedDocument<User>>;
}
