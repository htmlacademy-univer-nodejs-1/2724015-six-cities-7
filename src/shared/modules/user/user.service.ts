import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { injectable } from 'inversify';
import { CreateUserDto } from './create-user.dto.js';
import { UserModel } from './user.entity.js';

@injectable()
export class UserService {
  public async create(dto: CreateUserDto) {
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${scryptSync(dto.password, salt, 64).toString('hex')}`;
    const user = await UserModel.create({
      name: dto.name, email: dto.email, avatar: dto.avatar, type: dto.type, passwordHash,
    });
    return this.findById(user.id);
  }

  public async findById(id: string) {
    return UserModel.findById(id).exec();
  }

  public async findByEmail(email: string) {
    return UserModel.findOne({ email }).exec();
  }

  public async verifyCredentials(email: string, password: string) {
    const user = await UserModel.findOne({ email }).select('+passwordHash').exec();
    if (!user) {
      return null;
    }
    const [salt, hash] = user.passwordHash.split(':');
    if (!timingSafeEqual(Buffer.from(hash, 'hex'), scryptSync(password, salt, 64))) {
      return null;
    }
    return this.findById(user.id);
  }
}
