import { Types } from 'mongoose';

export type Offer = {
  title: string;
  description: string;
  date: Date;
  city: string;
  previewImage: string;
  images: string[];
  isPremium: boolean;
  rating: number;
  type: string;
  rooms: number;
  guests: number;
  price: number;
  amenities: string[];
  author: Types.ObjectId;
  latitude: number;
  longitude: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateOffer = Omit<Offer, 'createdAt' | 'updatedAt' | 'commentCount'>;
