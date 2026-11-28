import { RequestHandler } from 'express';
import { Middleware } from './middleware.interface.js';
import { HttpError } from './http-error.js';

export class ValidateObjectIdMiddleware implements Middleware {
  constructor(private readonly parameter: string) {}

  public execute: RequestHandler = (request, _response, next) => {
    const value = request.params[this.parameter];
    if (!/^[a-f\d]{24}$/i.test(value)) {
      throw new HttpError(400, `Invalid ObjectID: ${this.parameter}`);
    }
    next();
  };
}
