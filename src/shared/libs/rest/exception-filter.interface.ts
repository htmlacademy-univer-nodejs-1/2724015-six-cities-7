import { ErrorRequestHandler } from 'express';

export interface ExceptionFilterInterface {
  readonly catch: ErrorRequestHandler;
}
