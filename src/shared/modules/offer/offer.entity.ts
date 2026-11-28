import { Schema, Types, model } from 'mongoose';

export enum City {
  Paris = 'Paris', Cologne = 'Cologne', Brussels = 'Brussels',
  Amsterdam = 'Amsterdam', Hamburg = 'Hamburg', Dusseldorf = 'Dusseldorf',
}
export enum HousingType { Apartment = 'apartment', House = 'house', Room = 'room', Hotel = 'hotel' }
export enum Amenity {
  Breakfast = 'Breakfast', AirConditioning = 'Air conditioning',
  Workspace = 'Laptop friendly workspace', BabySeat = 'Baby seat',
  Washer = 'Washer', Towels = 'Towels', Fridge = 'Fridge',
}

export interface OfferEntity {
  title: string;
  description: string;
  date: Date;
  city: City;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  type: HousingType;
  rooms: number;
  guests: number;
  price: number;
  amenities: Amenity[];
  author: Types.ObjectId;
  latitude: number;
  longitude: number;
}

const offerSchema = new Schema<OfferEntity>({
  title: String, description: String, date: { type: Date, default: Date.now },
  city: String, previewImage: String, images: [String], isPremium: Boolean,
  type: String, rooms: Number, guests: Number, price: Number, amenities: [String],
  author: { type: Schema.Types.ObjectId, ref: 'User' }, latitude: Number, longitude: Number,
});
offerSchema.index({ date: -1 });
offerSchema.index({ city: 1, isPremium: 1, date: -1 });
export const OfferModel = model<OfferEntity>('Offer', offerSchema);

export interface FavoriteEntity {
  user: Types.ObjectId;
  offer: Types.ObjectId;
}

const favoriteSchema = new Schema<FavoriteEntity>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
});
favoriteSchema.index({ user: 1, offer: 1 }, { unique: true });
export const FavoriteModel = model<FavoriteEntity>('Favorite', favoriteSchema);
