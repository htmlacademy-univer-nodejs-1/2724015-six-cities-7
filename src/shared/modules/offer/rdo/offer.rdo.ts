import { Expose, Transform, Type } from 'class-transformer';
import { UserRdo } from '../../user/rdo/user.rdo.js';
import { Amenity, City, HousingType } from '../offer.entity.js';

export class OfferSummaryRdo {
  @Expose()
  @Transform(({ obj }) => obj._id ?? obj.id)
  public id!: string;

  @Expose()
  public title!: string;

  @Expose()
  public price!: number;

  @Expose()
  public type!: HousingType;

  @Expose()
  public isFavorite!: boolean;

  @Expose()
  public date!: string;

  @Expose()
  public city!: City;

  @Expose()
  public previewImage!: string;

  @Expose()
  public isPremium!: boolean;

  @Expose()
  public rating!: number;

  @Expose()
  public commentCount!: number;
}

export class OfferRdo extends OfferSummaryRdo {
  @Expose()
  public description!: string;

  @Expose()
  public images!: string[];

  @Expose()
  public rooms!: number;

  @Expose()
  public guests!: number;

  @Expose()
  public amenities!: Amenity[];

  @Expose()
  @Type(() => UserRdo)
  public author!: UserRdo;

  @Expose()
  public latitude!: number;

  @Expose()
  public longitude!: number;
}
