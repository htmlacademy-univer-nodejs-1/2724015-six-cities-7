import { IsBoolean, IsMongoId } from 'class-validator';

export class SetFavoriteDto {
  @IsMongoId()
  public userId!: string;

  @IsMongoId()
  public offerId!: string;

  @IsBoolean()
  public isFavorite!: boolean;
}
