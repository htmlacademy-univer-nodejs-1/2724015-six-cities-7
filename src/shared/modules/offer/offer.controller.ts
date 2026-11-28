import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { StatusCodes } from 'http-status-codes';
import { inject, injectable } from 'inversify';
import { Component } from '../../container/component.js';
import { Controller } from '../../libs/rest/controller.js';
import { HttpError } from '../../libs/rest/http-error.js';
import { HttpMethod } from '../../libs/rest/route.interface.js';
import { toResponse, toResponseList } from '../../libs/rest/response.js';
import { getUserId, requireAuth } from '../auth/auth.middleware.js';
import { CreateOfferDto } from './create-offer.dto.js';
import { UpdateOfferDto } from './update-offer.dto.js';
import { City } from './offer.entity.js';
import { OfferService } from './offer.service.js';
import { OfferRdo, OfferSummaryRdo } from './rdo/offer.rdo.js';

@injectable()
export class OfferController extends Controller {
  constructor(@inject(Component.OfferService) private readonly offers: OfferService) {
    super();
    this.addRoute({ path: '/', method: HttpMethod.Get, handler: this.index });
    this.addRoute({ path: '/premium', method: HttpMethod.Get, handler: this.premium });
    this.addRoute({ path: '/favorites', method: HttpMethod.Get, handler: this.favorites, middleware: [requireAuth] });
    this.addRoute({ path: '/', method: HttpMethod.Post, handler: this.create, middleware: [requireAuth] });
    this.addRoute({ path: '/:id', method: HttpMethod.Get, handler: this.show });
    this.addRoute({ path: '/:id', method: HttpMethod.Patch, handler: this.update, middleware: [requireAuth] });
    this.addRoute({ path: '/:id', method: HttpMethod.Delete, handler: this.delete, middleware: [requireAuth] });
    this.addRoute({ path: '/:id/favorite', method: HttpMethod.Post, handler: this.addFavorite, middleware: [requireAuth] });
    this.addRoute({ path: '/:id/favorite', method: HttpMethod.Delete, handler: this.removeFavorite, middleware: [requireAuth] });
  }

  private async index(request: Request, response: Response): Promise<void> {
    const count = request.query.count === undefined ? undefined : Number(request.query.count);
    this.ok(response, toResponseList(OfferSummaryRdo, await this.offers.find(count, response.locals.userId)));
  }

  private async premium(request: Request, response: Response): Promise<void> {
    this.ok(response, toResponseList(OfferSummaryRdo,
      await this.offers.findPremium(request.query.city as City, response.locals.userId)));
  }

  private async favorites(_request: Request, response: Response): Promise<void> {
    this.ok(response, toResponseList(OfferSummaryRdo, await this.offers.findFavorites(getUserId(response))));
  }

  private async show(request: Request, response: Response): Promise<void> {
    const offer = await this.offers.findById(request.params.id, response.locals.userId);
    if (!offer) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }
    this.ok(response, toResponse(OfferRdo, offer));
  }

  private async create(request: Request<Record<string, string>, unknown, CreateOfferDto>, response: Response): Promise<void> {
    const dto = plainToInstance(CreateOfferDto, request.body);
    dto.author = getUserId(response);
    this.created(response, toResponse(OfferRdo, await this.offers.create(dto)));
  }

  private async update(request: Request<Record<string, string>, unknown, UpdateOfferDto>, response: Response): Promise<void> {
    const dto = plainToInstance(UpdateOfferDto, request.body);
    const offer = await this.offers.update(request.params.id, dto, getUserId(response));
    this.ok(response, toResponse(OfferRdo, offer));
  }

  private async delete(request: Request, response: Response): Promise<void> {
    await this.offers.delete(request.params.id, getUserId(response));
    this.noContent(response);
  }

  private async addFavorite(request: Request, response: Response): Promise<void> {
    this.ok(response, toResponse(OfferRdo, await this.offers.setFavorite({
      offerId: request.params.id, userId: getUserId(response), isFavorite: true,
    })));
  }

  private async removeFavorite(request: Request, response: Response): Promise<void> {
    this.ok(response, toResponse(OfferRdo, await this.offers.setFavorite({
      offerId: request.params.id, userId: getUserId(response), isFavorite: false,
    })));
  }
}
