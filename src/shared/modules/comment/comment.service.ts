import { StatusCodes } from 'http-status-codes';
import { HttpError } from '../../libs/rest/http-error.js';
import { injectable } from 'inversify';
import { OfferModel } from '../offer/offer.entity.js';
import { UserModel } from '../user/user.entity.js';
import { CommentModel } from './comment.entity.js';
import { CreateCommentDto } from './create-comment.dto.js';

@injectable()
export class CommentService {
  public async create(dto: CreateCommentDto) {
    if (!await OfferModel.exists({ _id: dto.offer })) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'Offer not found');
    }
    if (!await UserModel.exists({ _id: dto.author })) {
      throw new HttpError(StatusCodes.NOT_FOUND, 'User not found');
    }
    const comment = await CommentModel.create({
      text: dto.text, rating: dto.rating, author: dto.author, offer: dto.offer,
    });
    return comment.populate('author');
  }

  public async findByOfferId(offerId: string) {
    return CommentModel.find({ offer: offerId }).sort({ date: -1, _id: -1 })
      .limit(50).populate('author').exec();
  }
}
