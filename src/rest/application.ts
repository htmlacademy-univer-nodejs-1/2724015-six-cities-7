import { CommentController } from '../shared/modules/comment/comment.controller.js';
import express, { Express } from 'express';
import { Server } from 'node:http';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { Database } from '../shared/libs/database/database.js';
import { Component } from '../shared/container/component.js';
import { Logger } from '../shared/libs/logger/logger.interface.js';
import { Config } from '../shared/libs/config/config.interface.js';
import { ExceptionFilter } from '../shared/libs/rest/exception-filter.js';
import { HttpError } from '../shared/libs/rest/http-error.js';
import { UserController } from '../shared/modules/user/user.controller.js';
import { OfferController } from '../shared/modules/offer/offer.controller.js';
import { AuthController } from '../shared/modules/auth/auth.controller.js';
import { AuthService } from '../shared/modules/auth/auth.service.js';
import { authenticate } from '../shared/modules/auth/auth.middleware.js';

@injectable()
export class Application {
  public readonly app: Express = express();
  public server?: Server;

  constructor(
    @inject(Component.Database) private readonly database: Database,
    @inject(Component.Logger) private readonly logger: Logger,
    @inject(Component.Config) private readonly config: Config,
    @inject(Component.CommentController) private readonly comments: CommentController,
    @inject(Component.UserController) private readonly users: UserController,
    @inject(Component.OfferController) private readonly offers: OfferController,
    @inject(Component.AuthController) private readonly authController: AuthController,
    @inject(Component.AuthService) private readonly auth: AuthService,
    @inject(Component.ExceptionFilter) private readonly exceptionFilter: ExceptionFilter,
  ) {}

  private registerMiddleware(): void {
    this.app.disable('x-powered-by');
    this.app.use(express.json());
    this.app.use(authenticate(this.auth));
  }

  private registerControllers(): void {
    this.app.use('/users', this.users.router);
    this.app.use('/offers', this.comments.router);
    this.app.use('/offers', this.offers.router);
    this.app.use('/auth', this.authController.router);
  }

  private registerExceptionFilters(): void {
    this.app.use((request, _response, next) => {
      next(new HttpError(StatusCodes.NOT_FOUND, `Route ${request.method} ${request.path} not found`));
    });
    this.app.use(this.exceptionFilter.catch);
  }

  public async init(): Promise<void> {
    try {
      await this.database.connect(this.config.get('DB_URI'));
      this.registerMiddleware();
      this.registerControllers();
      this.registerExceptionFilters();
      await new Promise<void>((resolve, reject) => {
        this.server = this.app.listen(this.config.get('PORT'), resolve);
        this.server.once('error', reject);
      });
      this.logger.info(`Сервер запущен. Порт: ${this.config.get('PORT')}`);
    } catch (error) {
      await this.database.disconnect();
      throw error;
    }
  }

  public async close(): Promise<void> {
    const server = this.server;
    if (server?.listening) {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await this.database.disconnect();
  }
}
