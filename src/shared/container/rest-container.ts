import { Model } from 'mongoose';
import { Database } from '../libs/database/database.interface.js';
import { MongoDatabase } from '../libs/database/mongo-database.js';
import { User } from '../../rest/modules/user/user.type.js';
import { UserModel } from '../../rest/modules/user/user.model.js';
import { UserService } from '../../rest/modules/user/user-service.interface.js';
import { DefaultUserService } from '../../rest/modules/user/default-user.service.js';
import { Offer } from '../../rest/modules/offer/offer.type.js';
import { OfferModel } from '../../rest/modules/offer/offer.model.js';
import { OfferService } from '../../rest/modules/offer/offer-service.interface.js';
import { DefaultOfferService } from '../../rest/modules/offer/default-offer.service.js';
import { Container } from 'inversify';
import { Application } from '../../rest/application.js';
import { Config } from '../libs/config/config.interface.js';
import { RestConfig } from '../libs/config/rest-config.js';
import { Logger } from '../libs/logger/logger.interface.js';
import { PinoLogger } from '../libs/logger/pino-logger.js';
import { Component } from './component.js';

export function createRestContainer(): Container {
  const container = new Container();

  container.bind<Logger>(Component.Logger).to(PinoLogger).inSingletonScope();
  container.bind<Config>(Component.Config).to(RestConfig).inSingletonScope();
  container.bind<Application>(Component.Application).to(Application).inSingletonScope();

  container.bind<Database>(Component.Database).to(MongoDatabase).inSingletonScope();
  container.bind<Model<User>>(Component.UserModel).toConstantValue(UserModel);
  container.bind<UserService>(Component.UserService).to(DefaultUserService).inSingletonScope();
  container.bind<Model<Offer>>(Component.OfferModel).toConstantValue(OfferModel);
  container.bind<OfferService>(Component.OfferService).to(DefaultOfferService).inSingletonScope();

  return container;
}
