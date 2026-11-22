import { Expose, Transform } from 'class-transformer';
import { UserType } from '../user.entity.js';

export class UserRdo {
  @Expose()
  @Transform(({ obj }) => obj._id ?? obj.id)
  public id!: string;

  @Expose()
  public name!: string;

  @Expose()
  public email!: string;

  @Expose()
  public avatar!: string;

  @Expose()
  public type!: UserType;
}
