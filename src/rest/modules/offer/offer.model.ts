import { model, Schema } from 'mongoose';
import { Offer } from './offer.type.js';

const offerSchema = new Schema<Offer>({
  title: { type: String, required: true },
  description: String,
  date: Date,
  city: String,
  previewImage: String,
  images: [String],
  isPremium: Boolean,
  rating: Number,
  type: String,
  rooms: Number,
  guests: Number,
  price: Number,
  amenities: [String],
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  latitude: Number,
  longitude: Number,
  commentCount: { type: Number, default: 0 },
}, { timestamps: true, collection: 'offers' });

export const OfferModel = model<Offer>('Offer', offerSchema);
