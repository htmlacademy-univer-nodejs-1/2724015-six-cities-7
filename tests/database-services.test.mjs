import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { UserService } from '../dist/shared/modules/user/user.service.js';
import { OfferService } from '../dist/shared/modules/offer/offer.service.js';
import { CommentService } from '../dist/shared/modules/comment/comment.service.js';
import { UserModel } from '../dist/shared/modules/user/user.entity.js';
import { OfferModel, FavoriteModel } from '../dist/shared/modules/offer/offer.entity.js';
import { CommentModel } from '../dist/shared/modules/comment/comment.entity.js';

test('MongoDB services implement rental scenarios', { skip: !process.env.TEST_DB_URI }, async () => {
  await mongoose.connect(process.env.TEST_DB_URI, { dbName: `six_cities_test_${randomUUID()}` });
  try {
    await Promise.all([UserModel.init(), OfferModel.init(), FavoriteModel.init(), CommentModel.init()]);
    const users = new UserService();
    const offers = new OfferService();
    const comments = new CommentService();
    const owner = await users.create({ name: 'Owner', email: 'owner@example.com', password: 'secret123', type: 'pro' });
    const guest = await users.create({ name: 'Guest', email: 'guest@example.com', password: 'secret456', type: 'regular' });
    assert.equal(owner.passwordHash, undefined);
    assert.equal(owner.avatar, 'default-avatar.png');
    const stored = await UserModel.findById(owner.id).select('+passwordHash');
    assert.notEqual(stored.passwordHash, 'secret123');
    assert.equal((await users.verifyCredentials('owner@example.com', 'secret123')).id, owner.id);
    assert.equal(await users.verifyCredentials('owner@example.com', 'incorrect'), null);
    assert.equal(await users.verifyCredentials('missing@example.com', 'secret123'), null);
    await assert.rejects(users.create({ name: 'Duplicate', email: owner.email, password: 'secret123', type: 'regular' }), { code: 11000 });

    const data = {
      title: 'Apartment in Paris', description: 'Spacious apartment in the city center',
      date: new Date('2026-01-01'), city: 'Paris', previewImage: 'preview.jpg',
      images: Array(6).fill('photo.jpg'), isPremium: true, type: 'apartment',
      rooms: 2, guests: 3, price: 150, amenities: ['Breakfast'], author: owner.id,
      latitude: 48.85661, longitude: 2.351499,
    };
    const offer = await offers.create(data);
    const id = offer._id.toString();
    assert.equal(offer.rating, 0);
    assert.equal(offer.commentCount, 0);
    assert.equal(offer.author.passwordHash, undefined);
    await assert.rejects(offers.update(id, { price: 200 }, guest.id));
    await assert.rejects(offers.delete(id, guest.id));
    const updated = await offers.update(id, { price: 200, author: guest.id, rating: 5 }, owner.id);
    assert.equal(updated.price, 200);
    assert.equal(updated.author._id.toString(), owner.id);
    assert.equal(updated.rating, 0);

    const first = await comments.create({ text: 'Excellent apartment', rating: 5, author: guest.id, offer: id, date: new Date(0) });
    assert.ok(first.date.getTime() > 0);
    assert.equal(first.author.passwordHash, undefined);
    assert.equal((await offers.findById(id)).rating, 5);
    await comments.create({ text: 'Good apartment', rating: 2, author: owner.id, offer: id });
    assert.equal((await offers.findById(id)).rating, 3.5);
    await Promise.all(Array.from({ length: 51 }, () => comments.create({ text: 'Another review', rating: 1, author: guest.id, offer: id })));
    const details = await offers.findById(id);
    assert.equal(details.commentCount, 53);
    assert.equal(details.rating, 1.1);
    const latest = await comments.findByOfferId(id);
    assert.equal(latest.length, 50);
    assert.ok(latest.every((comment, index) => index === 0 || latest[index - 1].date >= comment.date));

    await offers.setFavorite({ offerId: id, userId: guest.id, isFavorite: true });
    await offers.setFavorite({ offerId: id, userId: guest.id, isFavorite: true });
    assert.equal(await FavoriteModel.countDocuments(), 1);
    assert.equal((await offers.findById(id, guest.id)).isFavorite, true);
    assert.equal((await offers.findById(id, owner.id)).isFavorite, false);
    assert.equal((await offers.findById(id)).isFavorite, false);
    assert.equal((await offers.findFavorites(guest.id)).length, 1);
    await offers.setFavorite({ offerId: id, userId: guest.id, isFavorite: false });
    assert.equal((await offers.findFavorites(guest.id)).length, 0);
    await offers.setFavorite({ offerId: id, userId: guest.id, isFavorite: true });

    await OfferModel.insertMany(Array.from({ length: 64 }, (_, index) => ({ ...data, date: new Date(2026, 0, index + 2) })));
    const list = await offers.find();
    assert.equal(list.length, 60);
    assert.equal((await offers.find(100)).length, 65);
    assert.ok(list.every((item, index) => index === 0 || list[index - 1].date >= item.date));
    assert.equal(list[0].description, undefined);
    assert.equal((await offers.findPremium('Paris')).length, 3);
    assert.equal((await offers.findPremium('Hamburg')).length, 0);
    await offers.delete(id, owner.id);
    assert.equal(await offers.findById(id), null);
    assert.equal(await CommentModel.countDocuments({ offer: id }), 0);
    assert.equal(await FavoriteModel.countDocuments({ offer: id }), 0);
    await assert.rejects(comments.create({ text: 'Missing offer', rating: 5, author: guest.id, offer: id }));
  } finally {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
});
