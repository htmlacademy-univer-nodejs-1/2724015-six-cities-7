import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Logger } from '../logger/logger.interface.js';
import { ExceptionFilterInterface } from './exception-filter.interface.js';
import { HttpError } from './http-error.js';

@injectable()
export class ExceptionFilter implements ExceptionFilterInterface {
  constructor(@inject(Component.Logger) private readonly logger: Logger) {}

  public readonly catch: ErrorRequestHandler = (error: unknown, request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    let status = StatusCodes.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    if (error instanceof HttpError) {
      status = error.statusCode;
      message = error.message;
    } else if (error instanceof SyntaxError && 'status' in error && error.status === StatusCodes.BAD_REQUEST) {
      status = StatusCodes.BAD_REQUEST;
      message = 'Invalid JSON';
    } else if (error instanceof Error && (error.name === 'CastError' || error.name === 'BSONError')) {
      status = StatusCodes.BAD_REQUEST;
      message = 'Invalid request parameter';
    } else if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      status = StatusCodes.CONFLICT;
      message = 'Resource already exists';
    } else if (typeof error === 'object' && error !== null && 'type' in error && error.type === 'entity.too.large') {
      status = StatusCodes.REQUEST_TOO_LONG;
      message = 'Request body too large';
    }
    const details = error instanceof Error ? error.stack ?? error.message : String(error);
    this.logger.error(`${request.method} ${request.path}: ${status} ${details}`);
    response.status(status).json({ type: status >= 500 ? 'SERVER_ERROR' : 'HTTP_ERROR', message });
  };
}
