import { IsEmail, IsEnum, IsString, Length, Matches, ValidateIf } from 'class-validator';
import { UserType } from './user.entity.js';

export class CreateUserDto {
  @IsString()
  @Length(1, 15)
  public name!: string;

  @IsEmail()
  public email!: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Matches(/\.(jpg|png)$/i)
  public avatar?: string;

  @IsString()
  @Length(6, 12)
  public password!: string;

  @IsEnum(UserType)
  public type!: UserType;
}
