import { ArrayNotEmpty, ArrayMinSize, ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsDate, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsNumber, IsString, IsUrl, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Amenity, City, HousingType } from './offer.entity.js';

export class CreateOfferDto {
  @IsString()
  @Length(10, 100)
  public title!: string;

  @IsString()
  @Length(20, 1024)
  public description!: string;

  @Type(() => Date)
  @IsDate()
  public date!: Date;

  @IsEnum(City)
  public city!: City;

  @IsString()
  @IsNotEmpty()
  @IsUrl()
  public previewImage!: string;

  @IsArray()
  @ArrayMinSize(6)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsUrl({}, { each: true })
  public images!: string[];

  @IsBoolean()
  public isPremium!: boolean;

  @IsEnum(HousingType)
  public type!: HousingType;

  @IsInt()
  @Min(1)
  @Max(8)
  public rooms!: number;

  @IsInt()
  @Min(1)
  @Max(10)
  public guests!: number;

  @IsInt()
  @Min(100)
  @Max(100000)
  public price!: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(Amenity, { each: true })
  public amenities!: Amenity[];

  @IsMongoId()
  public author!: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  public latitude!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  public longitude!: number;
}
