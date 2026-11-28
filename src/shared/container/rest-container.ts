import { CommentController } from '../modules/comment/comment.controller.js';
import { UserController } from '../modules/user/user.controller.js';
import { OfferController } from '../modules/offer/offer.controller.js';
import { AuthController } from '../modules/auth/auth.controller.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { ExceptionFilter } from '../libs/rest/exception-filter.js';
import { Database } from '../libs/database/database.js';
import { UserService } from '../modules/user/user.service.js';
import { OfferService } from '../modules/offer/offer.service.js';
import { CommentService } from '../modules/comment/comment.service.js';
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

  container.bind<Database>(Component.Database).to(Database).inSingletonScope();
  container.bind<UserService>(Component.UserService).to(UserService).inSingletonScope();
  container.bind<OfferService>(Component.OfferService).to(OfferService).inSingletonScope();
  container.bind<CommentService>(Component.CommentService).to(CommentService).inSingletonScope();

  container.bind<UserController>(Component.UserController).to(UserController).inSingletonScope();
  container.bind<OfferController>(Component.OfferController).to(OfferController).inSingletonScope();
  container.bind<AuthController>(Component.AuthController).to(AuthController).inSingletonScope();
  container.bind<AuthService>(Component.AuthService).to(AuthService).inSingletonScope();
  container.bind<ExceptionFilter>(Component.ExceptionFilter).to(ExceptionFilter).inSingletonScope();

  container.bind<CommentController>(Component.CommentController).to(CommentController).inSingletonScope();

  return container;
}
