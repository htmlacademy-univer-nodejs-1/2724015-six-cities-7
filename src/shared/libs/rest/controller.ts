import { Response, Router } from 'express';
import asyncHandler from 'express-async-handler';
import { StatusCodes } from 'http-status-codes';
import { injectable } from 'inversify';
import { ControllerInterface } from './controller.interface.js';
import { Route } from './route.interface.js';

@injectable()
export abstract class Controller implements ControllerInterface {
  public readonly router = Router();

  protected addRoute(route: Route): void {
    this.router[route.method](route.path, ...(route.middleware ?? []).map((middleware) => asyncHandler(middleware.execute.bind(middleware))), asyncHandler(route.handler.bind(this)));
  }

  protected ok<T>(response: Response, data: T): void {
    response.status(StatusCodes.OK).json(data);
  }

  protected created<T>(response: Response, data: T): void {
    response.status(StatusCodes.CREATED).json(data);
  }

  protected noContent(response: Response): void {
    response.status(StatusCodes.NO_CONTENT).send();
  }
}
