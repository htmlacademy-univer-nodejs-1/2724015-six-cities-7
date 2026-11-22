import { createHmac, timingSafeEqual } from 'node:crypto';
import { inject, injectable } from 'inversify';
import { StatusCodes } from 'http-status-codes';
import { Component } from '../../container/component.js';
import { Config } from '../../libs/config/config.interface.js';
import { HttpError } from '../../libs/rest/http-error.js';

@injectable()
export class AuthService {
  constructor(@inject(Component.Config) private readonly config: Config) {}

  private sign(value: string): string {
    return createHmac('sha256', this.config.get('SALT')).update(value).digest('base64url');
  }

  public createToken(userId: string): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: userId, exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url');
    const value = `${header}.${payload}`;
    return `${value}.${this.sign(value)}`;
  }

  public verifyToken(token: string): string {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token');
      }
      const [header, payload, signature] = parts;
      const expected = Buffer.from(this.sign(`${header}.${payload}`));
      const actual = Buffer.from(signature);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        throw new Error('Invalid signature');
      }
      const metadata = JSON.parse(Buffer.from(header, 'base64url').toString()) as { alg: string; typ: string };
      const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { sub: string; exp: number };
      if (metadata.alg !== 'HS256' || metadata.typ !== 'JWT' || !/^[a-f\d]{24}$/i.test(data.sub)
        || !Number.isFinite(data.exp) || data.exp <= Date.now() / 1000) {
        throw new Error('Invalid claims');
      }
      return data.sub;
    } catch {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token');
    }
  }
}
