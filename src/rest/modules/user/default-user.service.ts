import { randomBytes, scryptSync } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { HydratedDocument, Model } from 'mongoose';
import { Component } from '../../../shared/container/component.js';
import { CreateUser, User } from './user.type.js';
import { UserService } from './user-service.interface.js';

@injectable()
export class DefaultUserService implements UserService {
  constructor(@inject(Component.UserModel) private readonly userModel: Model<User>) {}

  public async findById(id: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<HydratedDocument<User> | null> {
    return this.userModel.findOne({ email }).exec();
  }

  public async create(data: CreateUser): Promise<HydratedDocument<User>> {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(data.password, salt, 64).toString('hex');
    return this.userModel.create({ ...data, password: `${salt}:${hash}` });
  }
}
