import { RequestHandler } from 'express';
import { Middleware } from './middleware.interface.js';

export enum HttpMethod { Get = 'get', Post = 'post', Patch = 'patch', Delete = 'delete' }

export interface Route {
  path: string;
  method: HttpMethod;
  handler: RequestHandler;
  middleware?: Middleware[];
}
