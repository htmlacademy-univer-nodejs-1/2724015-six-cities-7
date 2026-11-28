import { ArrayNotEmpty, ArrayMinSize, ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsNotEmpty, IsNumber, IsString, IsUrl, Length, Max, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import { Amenity, City, HousingType } from './offer.entity.js';

export class UpdateOfferDto {
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(10, 100)
  public title?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @Length(20, 1024)
  public description?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @Type(() => Date)
  @IsDate()
  public date?: Date;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(City)
  public city?: City;

  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  public previewImage?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsUrl({}, { each: true })
  public images?: string[];

  @ValidateIf((_object, value) => value !== undefined)
  @IsBoolean()
  public isPremium?: boolean;

  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(HousingType)
  public type?: HousingType;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(8)
  public rooms?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(10)
  public guests?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt()
  @Min(100)
  @Max(100000)
  public price?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(Amenity, { each: true })
  public amenities?: Amenity[];

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber()
  @Min(-90)
  @Max(90)
  public latitude?: number;

  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber()
  @Min(-180)
  @Max(180)
  public longitude?: number;
}
