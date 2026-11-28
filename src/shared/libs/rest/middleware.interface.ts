import { RequestHandler } from 'express';

export interface Middleware {
  execute: RequestHandler;
}
