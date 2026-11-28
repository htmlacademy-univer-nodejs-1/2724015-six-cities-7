import { RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HttpError } from '../../libs/rest/http-error.js';
import { AuthService } from './auth.service.js';

declare module 'express-serve-static-core' {
  interface Locals {
    userId?: string;
  }
}

export const authenticate = (auth: AuthService): RequestHandler => (request, response, next) => {
  try {
    const header = request.header('authorization');
    if (header) {
      const [scheme, token, extra] = header.split(' ');
      if (scheme.toLowerCase() !== 'bearer' || !token || extra) {
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid authorization header');
      }
      response.locals.userId = auth.verifyToken(token);
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export const requireAuth: RequestHandler = (_request, response, next) => {
  if (!response.locals.userId) {
    next(new HttpError(StatusCodes.UNAUTHORIZED, 'Authentication required'));
    return;
  }
  next();
};

export const requireAnonymous: RequestHandler = (_request, response, next) => {
  if (response.locals.userId) {
    next(new HttpError(StatusCodes.FORBIDDEN, 'Only anonymous clients can use this resource'));
    return;
  }
  next();
};

export function getUserId(response: Response): string {
  const userId = response.locals.userId;
  if (!userId) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, 'Authentication required');
  }
  return userId;
}
