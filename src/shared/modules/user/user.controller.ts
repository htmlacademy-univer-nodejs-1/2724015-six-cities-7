import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Controller } from '../../libs/rest/controller.js';
import { HttpMethod } from '../../libs/rest/route.interface.js';
import { toResponse } from '../../libs/rest/response.js';
import { ValidateDataMiddleware } from '../../libs/rest/validate-data.middleware.js';
import { CreateUserDto } from './create-user.dto.js';
import { UserService } from './user.service.js';
import { UserRdo } from './rdo/user.rdo.js';

@injectable()
export class UserController extends Controller {
  constructor(@inject(Component.UserService) private readonly users: UserService) {
    super();
    this.addRoute({ path: '/', method: HttpMethod.Post, handler: this.create, middleware: [new ValidateDataMiddleware(CreateUserDto)] });
  }

  private async create(request: Request<Record<string, string>, unknown, CreateUserDto>, response: Response): Promise<void> {
    const dto = plainToInstance(CreateUserDto, request.body);
    const user = await this.users.create(dto);
    this.created(response, toResponse(UserRdo, user));
  }
}
