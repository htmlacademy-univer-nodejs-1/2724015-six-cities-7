import { Amenity, City, HousingType } from './offer.entity.js';

export class UpdateOfferDto {
  public title?: string;
  public description?: string;
  public date?: Date;
  public city?: City;
  public previewImage?: string;
  public images?: string[];
  public isPremium?: boolean;
  public type?: HousingType;
  public rooms?: number;
  public guests?: number;
  public price?: number;
  public amenities?: Amenity[];
  public latitude?: number;
  public longitude?: number;
}
