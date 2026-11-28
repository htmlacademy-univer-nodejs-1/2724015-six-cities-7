import { RequestHandler } from 'express';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Middleware } from './middleware.interface.js';
import { HttpError } from './http-error.js';

export class ValidateDataMiddleware implements Middleware {
  constructor(private readonly dto: ClassConstructor<object>, private readonly source: 'body' | 'query' = 'body') {}

  public execute: RequestHandler = async (request, _response, next) => {
    const data: unknown = request[this.source];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new HttpError(400, 'Expected an object');
    }
    if (this.source === 'body' && Object.keys(data).length === 0) {
      throw new HttpError(400, 'Request body must not be empty');
    }
    const instance = plainToInstance(this.dto, data);
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
    if (errors.length) {
      throw new HttpError(400, errors.map((error) =>
        `${error.property}: ${Object.values(error.constraints ?? {}).join(', ')}`).join('; '));
    }
    request[this.source] = instance;
    next();
  };
}
