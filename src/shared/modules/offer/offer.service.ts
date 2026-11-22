import { StatusCodes } from 'http-status-codes';
import { HttpError } from '../../libs/rest/http-error.js';
import { injectable } from 'inversify';
import { PipelineStage, Types } from 'mongoose';
import { CommentModel } from '../comment/comment.entity.js';
import { UserModel } from '../user/user.entity.js';
import { CreateOfferDto } from './create-offer.dto.js';
import { UpdateOfferDto } from './update-offer.dto.js';
import { SetFavoriteDto } from './set-favorite.dto.js';
import { City, FavoriteModel, OfferModel } from './offer.entity.js';

const summaryFields = {
  price: 1, title: 1, type: 1, isFavorite: 1, date: 1, city: 1,
  previewImage: 1, isPremium: 1, rating: 1, commentCount: 1,
};

@injectable()
export class OfferService {
  private computedFields(userId?: string): PipelineStage[] {
    return [
      { $lookup: {
        from: CommentModel.collection.name, localField: '_id', foreignField: 'offer',
        pipeline: [{ $group: { _id: null, count: { $sum: 1 }, rating: { $avg: '$rating' } } }],
        as: 'statistics',
      } },
      { $lookup: {
        from: FavoriteModel.collection.name, localField: '_id', foreignField: 'offer',
        pipeline: [{ $match: { user: userId ? new Types.ObjectId(userId) : null } }],
        as: 'favorites',
      } },
      { $set: {
        commentCount: { $ifNull: [{ $arrayElemAt: ['$statistics.count', 0] }, 0] },
        rating: { $round: [{ $ifNull: [{ $arrayElemAt: ['$statistics.rating', 0] }, 0] }, 1] },
        isFavorite: { $gt: [{ $size: '$favorites' }, 0] },
      } },
      { $unset: ['statistics', 'favorites'] },
    ];
  }

  private offerFields(dto: UpdateOfferDto): UpdateOfferDto {
    const fields: (keyof UpdateOfferDto)[] = [
      'title', 'description', 'date', 'city', 'previewImage', 'images', 'isPremium',
      'type', 'rooms', 'guests', 'price', 'amenities', 'latitude', 'longitude',
    ];
    return Object.fromEntries(fields.filter((field) => dto[field] !== undefined)
      .map((field) => [field, dto[field]]));
  }

  public async create(dto: CreateOfferDto) {
    if (!await UserModel.exists({ _id: dto.author })) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const offer = await OfferModel.create({ ...this.offerFields(dto), author: dto.author });
    return this.findById(offer.id, dto.author);
  }

  public async findById(id: string, userId?: string) {
    const [offer] = await OfferModel.aggregate([
      { $match: { _id: new Types.ObjectId(id) } },
      ...this.computedFields(userId),
      { $lookup: {
        from: UserModel.collection.name, localField: 'author', foreignField: '_id',
        pipeline: [{ $project: { passwordHash: 0 } }], as: 'author',
      } },
      { $unwind: '$author' },
    ]).exec();
    return offer ?? null;
  }

  public async find(count = 60, userId?: string) {
    if (!Number.isInteger(count) || count < 1) {
      throw new HttpError(StatusCodes.BAD_REQUEST, 'Count must be a positive integer');
    }
    return OfferModel.aggregate([
      { $sort: { date: -1, _id: -1 } }, { $limit: count },
      ...this.computedFields(userId), { $project: summaryFields },
    ]).exec();
  }

  public async findPremium(city: City, userId?: string) {
    return OfferModel.aggregate([
      { $match: { city, isPremium: true } },
      { $sort: { date: -1, _id: -1 } }, { $limit: 3 },
      ...this.computedFields(userId), { $project: summaryFields },
    ]).exec();
  }

  public async findFavorites(userId: string) {
    return OfferModel.aggregate([
      { $sort: { date: -1, _id: -1 } }, ...this.computedFields(userId),
      { $match: { isFavorite: true } }, { $project: summaryFields },
    ]).exec();
  }

  public async setFavorite(dto: SetFavoriteDto) {
    const { offerId: id, userId, isFavorite } = dto;
    if (!await OfferModel.exists({ _id: id })) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }
    if (!await UserModel.exists({ _id: userId })) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const filter = { user: userId, offer: id };
    if (isFavorite) {
      await FavoriteModel.updateOne(filter, { $setOnInsert: filter }, { upsert: true });
    } else {
      await FavoriteModel.deleteOne(filter);
    }
    return this.findById(id, userId);
  }

  public async update(id: string, dto: UpdateOfferDto, authorId: string) {
    const offer = await OfferModel.findOneAndUpdate(
      { _id: id, author: authorId }, { $set: this.offerFields(dto) }, { new: true },
    ).exec();
    if (!offer) {
      if (await OfferModel.exists({ _id: id })) {
        throw new HttpError(StatusCodes.FORBIDDEN, 'Access denied');
      }
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }
    return this.findById(id, authorId);
  }

  public async delete(id: string, authorId: string): Promise<void> {
    const offer = await OfferModel.findOneAndDelete({ _id: id, author: authorId }).exec();
    if (!offer) {
      if (await OfferModel.exists({ _id: id })) {
        throw new HttpError(StatusCodes.FORBIDDEN, 'Access denied');
      }
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }
    await CommentModel.deleteMany({ offer: id }).exec();
    await FavoriteModel.deleteMany({ offer: id }).exec();
  }
}
