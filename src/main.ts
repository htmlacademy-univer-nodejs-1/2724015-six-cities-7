import 'reflect-metadata';
import { Application } from './rest/application.js';
import { Component } from './shared/container/component.js';
import { createRestContainer } from './shared/container/rest-container.js';
import { Logger } from './shared/libs/logger/logger.interface.js';

const container = createRestContainer();
const logger = container.get<Logger>(Component.Logger);

try {
  const application = container.get<Application>(Component.Application);
  application.init();
} catch (error) {
  logger.error((error as Error).message);
  process.exitCode = 1;
}
