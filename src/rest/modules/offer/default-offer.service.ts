import { inject, injectable } from 'inversify';
import { HydratedDocument, Model } from 'mongoose';
import { Component } from '../../../shared/container/component.js';
import { CreateOffer, Offer } from './offer.type.js';
import { OfferService } from './offer-service.interface.js';

@injectable()
export class DefaultOfferService implements OfferService {
  constructor(@inject(Component.OfferModel) private readonly offerModel: Model<Offer>) {}

  public async findById(id: string): Promise<HydratedDocument<Offer> | null> {
    return this.offerModel.findById(id).exec();
  }

  public async create(data: CreateOffer): Promise<HydratedDocument<Offer>> {
    return this.offerModel.create(data);
  }
}
