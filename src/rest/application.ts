import { inject, injectable } from 'inversify';
import { Component } from '../shared/container/component.js';
import { Logger } from '../shared/libs/logger/logger.interface.js';
import { Config } from '../shared/libs/config/config.interface.js';

@injectable()
export class Application {
  constructor(
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config,
  ) {}

  public init(): void {
    this.logger.info(`Приложение инициализировано. Порт: ${this.config.get('PORT')}`);
  }
}
