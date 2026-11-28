import { Database } from '../shared/libs/database/database.js';
import { inject, injectable } from 'inversify';
import { Component } from '../shared/container/component.js';
import { Logger } from '../shared/libs/logger/logger.interface.js';
import { Config } from '../shared/libs/config/config.interface.js';

@injectable()
export class Application {
  constructor(
    @inject(Component.Database) private readonly database: Database,
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config,
  ) {}

  public async init(): Promise<void> {
    await this.database.connect(this.config.get('DB_URI'));
    this.logger.info(`Приложение инициализировано. Порт: ${this.config.get('PORT')}`);
  }
}
