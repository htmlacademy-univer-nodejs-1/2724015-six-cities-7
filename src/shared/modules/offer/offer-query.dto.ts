import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsMongoId, Min, ValidateIf } from 'class-validator';
import { City } from './offer.entity.js';

export class OfferQueryDto {
  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public count?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(City)
  public city?: City;

  @ValidateIf((_object, value) => value !== undefined)
  @IsMongoId()
  public userId?: string;
}

export class PremiumQueryDto {
  @IsEnum(City)
  public city!: City;

  @ValidateIf((_object, value) => value !== undefined)
  @IsMongoId()
  public userId?: string;
}

export class FavoriteQueryDto {
  @IsMongoId()
  public userId!: string;
}
