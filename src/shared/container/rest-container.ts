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

  return container;
}
