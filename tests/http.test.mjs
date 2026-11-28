import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import mongoose from 'mongoose';
import { createRestContainer } from '../dist/shared/container/rest-container.js';
import { Component } from '../dist/shared/container/component.js';
import { Controller } from '../dist/shared/libs/rest/controller.js';
import { UserModel } from '../dist/shared/modules/user/user.entity.js';
import { FavoriteModel, OfferModel } from '../dist/shared/modules/offer/offer.entity.js';

class FailingController extends Controller {
  constructor() {
    super();
    this.addRoute({ path: '/', method: 'get', handler: async () => {
      await Promise.resolve();
      throw new Error('Private server details');
    } });
  }
}

test('Express handles resource routes and synchronous/asynchronous failures', { skip: !process.env.TEST_DB_URI }, async () => {
  const uri = new URL(process.env.TEST_DB_URI);
  uri.pathname = `/six_cities_http_test_${randomUUID()}`;
  const config = { PORT: 0, DB_URI: uri.toString(), SALT: 'integration-test-secret' };
  const logs = [];
  const container = createRestContainer();
  container.rebind(Component.Config).toConstantValue({ get: (key) => config[key] });
  container.rebind(Component.Logger).toConstantValue({ info() {}, error: (message) => logs.push(message) });
  const application = container.get(Component.Application);
  application.app.use('/test-error', new FailingController().router);
  await application.init();
  try {
    await Promise.all([UserModel.init(), OfferModel.init(), FavoriteModel.init()]);
    const base = `http://127.0.0.1:${application.server.address().port}`;
    async function request(path, method = 'GET', body, token) {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const text = await response.text();
      return { status: response.status, body: text ? JSON.parse(text) : null };
    }
    const unknown = await request('/missing');
    assert.equal(unknown.status, 404);
    assert.equal(unknown.body.type, 'HTTP_ERROR');
    const failure = await request('/test-error');
    assert.equal(failure.status, 500);
    assert.deepEqual(failure.body, { type: 'SERVER_ERROR', message: 'Internal server error' });
    assert.ok(logs.some((line) => line.includes('Private server details')));
    const invalidJson = await fetch(`${base}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(invalidJson.status, 400);
    assert.equal((await invalidJson.json()).type, 'HTTP_ERROR');

    for (const invalid of [null, [], {}, { name: 'A' }]) {
      assert.equal((await request('/users', 'POST', invalid)).status, 400);
    }
    const ownerData = { name: 'Owner', email: 'owner@example.com', password: 'secret123', type: 'pro' };
    const owner = await request('/users', 'POST', ownerData);
    assert.equal(owner.status, 201);
    assert.ok(owner.body.id);
    assert.equal(owner.body._id, undefined);
    assert.equal(owner.body.passwordHash, undefined);
    assert.equal(owner.body.password, undefined);
    assert.equal((await request('/users', 'POST', ownerData)).status, 409);
    for (const invalid of [{ name: '' }, { name: 'a'.repeat(16) }, { email: 'bad' }, { password: 'short' },
      { password: 'a'.repeat(13) }, { type: 'admin' }, { avatar: 'image.gif' }]) {
      assert.equal((await request('/users', 'POST', { ...ownerData, ...invalid })).status, 400);
    }
    assert.equal((await request('/auth/login', 'POST', { email: ownerData.email, password: 'wrong123' })).status, 401);
    const login = await request('/auth/login', 'POST', { email: ownerData.email, password: ownerData.password });
    assert.equal(login.status, 200);
    const token = login.body.token;
    assert.ok(token);
    assert.equal((await request('/auth/login', 'GET', undefined, token)).body.id, owner.body.id);
    assert.equal((await request('/auth/login')).status, 401);
    assert.equal((await request('/auth/login', 'GET', undefined, `${token}tampered`)).status, 401);
    assert.equal((await request('/users', 'POST', ownerData, token)).status, 409);

    const guestData = { name: 'Guest', email: 'guest@example.com', password: 'secret456', type: 'regular' };
    const guest = await request('/users', 'POST', guestData);
    const data = {
      title: 'Apartment in Paris', description: 'Spacious apartment in the city center',
      date: '2026-01-01', city: 'Paris', previewImage: 'https://example.com/preview.jpg',
      images: Array(6).fill('https://example.com/photo.jpg'), isPremium: true, type: 'apartment',
      rooms: 2, guests: 3, price: 150, amenities: ['Breakfast'], author: guest.body.id,
      latitude: 48.85661, longitude: 2.351499,
    };
    const offer = await request('/offers', 'POST', data);
    assert.equal(offer.status, 201);
    const id = offer.body.id;
    assert.equal(offer.body.author.id, guest.body.id);
    assert.equal(offer.body.author.passwordHash, undefined);
    assert.equal((await request(`/offers/${id}`)).status, 200);
    const list = await request('/offers');
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].description, undefined);
    assert.equal((await request('/offers/premium?city=Paris')).body.length, 1);
    assert.equal((await request('/offers/favorites')).status, 400);
    assert.equal((await request('/offers?count=-1')).status, 400);
    assert.equal((await request('/offers/invalid-id')).status, 400);
    for (const method of ['PATCH', 'DELETE']) {
      assert.equal((await request('/offers/invalid-id', method, { price: 200 })).status, 400);
    }
    for (const method of ['POST', 'DELETE']) {
      assert.equal((await request(`/offers/invalid/favorite?userId=${owner.body.id}`, method)).status, 400);
    }
    assert.equal((await request('/offers/000000000000000000000000')).status, 404);
    assert.equal((await request(`/offers/${id}`, 'PATCH', { price: 200 })).status, 200);
    assert.equal((await request(`/offers/${id}`, 'PATCH', { price: 200 }, token)).body.price, 200);
    assert.equal((await request(`/offers/${id}/favorite?userId=${guest.body.id}`, 'POST')).body.isFavorite, true);
    assert.equal((await request(`/offers/favorites?userId=${guest.body.id}`)).body.length, 1);
    assert.equal((await request(`/offers/favorites?userId=${owner.body.id}`)).body.length, 0);
    assert.equal((await request(`/offers/${id}/favorite?userId=${guest.body.id}`, 'DELETE')).body.isFavorite, false);
    const commentData = { text: 'A very pleasant stay', rating: 5, author: owner.body.id };
    assert.equal((await request(`/offers/${id}/comments`)).body.length, 0);
    const comment = await request(`/offers/${id}/comments`, 'POST', commentData);
    assert.equal(comment.status, 201);
    assert.equal(comment.body.author.id, owner.body.id);
    assert.equal(comment.body.author.passwordHash, undefined);
    assert.ok(comment.body.date);
    assert.equal((await request(`/offers/${id}`)).body.rating, 5);
    assert.equal((await request(`/offers/${id}`)).body.commentCount, 1);
    assert.equal((await request(`/offers/${id}/comments`)).body.length, 1);
    for (const invalid of [ { text: 'bad' }, { rating: 6 }, { rating: 1.5 }, { author: 'bad' }, { author: undefined }, { date: '2020-01-01' } ]) {
      assert.equal((await request(`/offers/${id}/comments`, 'POST', { ...commentData, ...invalid })).status, 400);
    }
    assert.equal((await request(`/offers/${id}/comments`, 'PATCH', commentData)).status, 404);
    assert.equal((await request('/offers/invalid/comments', 'POST', commentData)).status, 400);
    assert.equal((await request('/offers/000000000000000000000000/comments')).status, 404);
    assert.equal((await request(`/offers/${id}/comments`)).body.length, 1);
    for (const invalid of [ { title: 'short' }, { rooms: 0 }, { guests: 11 }, { price: '200' },
      { city: 'London' }, { images: [] }, { amenities: [] }, { author: 'bad' }, { latitude: 91 },
      { isPremium: 'true' }, { date: 'invalid' }, { previewImage: 'invalid' } ]) {
      assert.equal((await request('/offers', 'POST', { ...data, ...invalid })).status, 400);
    }
    for (const invalid of [{ price: null }, { author: owner.body.id }, {}, { rating: 5 }]) {
      assert.equal((await request(`/offers/${id}`, 'PATCH', invalid)).status, 400);
    }
    assert.equal((await request('/offers/premium?city=London')).status, 400);
    assert.equal((await request('/offers/premium')).status, 400);
    assert.equal((await request('/offers?userId=bad')).status, 400);
    assert.equal((await request(`/offers/${id}/favorite?userId=bad`, 'POST')).status, 400);
    const removed = await request(`/offers/${id}`, 'DELETE');
    assert.equal(removed.status, 204);
    assert.equal(removed.body, null);
    assert.equal((await request(`/offers/${id}`, 'DELETE', undefined, token)).status, 404);
    assert.equal((await request(`/offers/${id}/comments`)).status, 404);
  } finally {
    await mongoose.connection.dropDatabase();
    await application.close();
  }
});
