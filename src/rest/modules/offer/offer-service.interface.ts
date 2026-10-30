import { HydratedDocument } from 'mongoose';
import { CreateOffer, Offer } from './offer.type.js';

export interface OfferService {
  findById(id: string): Promise<HydratedDocument<Offer> | null>;
  create(data: CreateOffer): Promise<HydratedDocument<Offer>>;
}
