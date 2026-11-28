import { Schema, Types, model } from 'mongoose';

export interface CommentEntity {
  text: string;
  date: Date;
  rating: number;
  author: Types.ObjectId;
  offer: Types.ObjectId;
}

const commentSchema = new Schema<CommentEntity>({
  text: String, date: { type: Date, default: Date.now }, rating: Number,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  offer: { type: Schema.Types.ObjectId, ref: 'Offer' },
});
commentSchema.index({ offer: 1, date: -1 });
export const CommentModel = model<CommentEntity>('Comment', commentSchema);
