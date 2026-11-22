import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Controller } from '../../libs/rest/controller.js';
import { HttpError } from '../../libs/rest/http-error.js';
import { HttpMethod } from '../../libs/rest/route.interface.js';
import { toResponse } from '../../libs/rest/response.js';
import { UserRdo } from '../user/rdo/user.rdo.js';
import { UserService } from '../user/user.service.js';
import { getUserId, requireAnonymous, requireAuth } from './auth.middleware.js';
import { AuthService } from './auth.service.js';
import { LoginUserDto } from './login-user.dto.js';

@injectable()
export class AuthController extends Controller {
  constructor(
    @inject(Component.UserService) private readonly users: UserService,
    @inject(Component.AuthService) private readonly auth: AuthService,
  ) {
    super();
    this.addRoute({ path: '/login', method: HttpMethod.Post, handler: this.login, middleware: [requireAnonymous] });
    this.addRoute({ path: '/login', method: HttpMethod.Get, handler: this.check, middleware: [requireAuth] });
  }

  private async login(request: Request<Record<string, string>, unknown, LoginUserDto>, response: Response): Promise<void> {
    const dto = plainToInstance(LoginUserDto, request.body);
    const user = await this.users.verifyCredentials(dto.email, dto.password);
    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
    }
    this.ok(response, { ...toResponse(UserRdo, user), token: this.auth.createToken(user.id) });
  }

  private async check(_request: Request, response: Response): Promise<void> {
    const user = await this.users.findById(getUserId(response));
    if (!user) {
      throw new HttpError(StatusCodes.UNAUTHORIZED, 'User not found');
    }
    this.ok(response, toResponse(UserRdo, user));
  }
}
