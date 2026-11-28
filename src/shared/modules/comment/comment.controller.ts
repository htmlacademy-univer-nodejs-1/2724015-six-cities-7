import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Controller } from '../../libs/rest/controller.js';
import { HttpMethod } from '../../libs/rest/route.interface.js';
import { ValidateDataMiddleware } from '../../libs/rest/validate-data.middleware.js';
import { ValidateObjectIdMiddleware } from '../../libs/rest/validate-object-id.middleware.js';
import { toResponse, toResponseList } from '../../libs/rest/response.js';
import { CommentService } from './comment.service.js';
import { CreateCommentDto } from './create-comment.dto.js';
import { CommentRdo } from './comment.rdo.js';

@injectable()
export class CommentController extends Controller {
  constructor(@inject(Component.CommentService) private readonly comments: CommentService) {
    super();
    const id = new ValidateObjectIdMiddleware('offerId');
    this.addRoute({ path: '/:offerId/comments', method: HttpMethod.Get, handler: this.index, middleware: [id] });
    this.addRoute({ path: '/:offerId/comments', method: HttpMethod.Post, handler: this.create,
      middleware: [id, new ValidateDataMiddleware(CreateCommentDto)] });
  }

  private async index(request: Request, response: Response): Promise<void> {
    this.ok(response, toResponseList(CommentRdo, await this.comments.findByOfferId(request.params.offerId)));
  }

  private async create(request: Request, response: Response): Promise<void> {
    this.created(response, toResponse(CommentRdo, await this.comments.create({
      ...request.body, offer: request.params.offerId,
    })));
  }
}
