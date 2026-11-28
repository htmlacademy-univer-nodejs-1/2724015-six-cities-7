import { Expose, Transform, Type } from 'class-transformer';
import { UserRdo } from '../user/rdo/user.rdo.js';

export class CommentRdo {
  @Expose()
  @Transform(({ obj }) => obj._id ?? obj.id)
  public id!: string;

  @Expose()
  public text!: string;

  @Expose()
  public date!: Date;

  @Expose()
  public rating!: number;

  @Expose()
  @Type(() => UserRdo)
  public author!: UserRdo;
}
