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

    const ownerData = { name: 'Owner', email: 'owner@example.com', password: 'secret123', type: 'pro' };
    const owner = await request('/users', 'POST', ownerData);
    assert.equal(owner.status, 201);
    assert.ok(owner.body.id);
    assert.equal(owner.body._id, undefined);
    assert.equal(owner.body.passwordHash, undefined);
    assert.equal(owner.body.password, undefined);
    assert.equal((await request('/users', 'POST', ownerData)).status, 409);
    assert.equal((await request('/auth/login', 'POST', { email: ownerData.email, password: 'wrong' })).status, 401);
    const login = await request('/auth/login', 'POST', ownerData);
    assert.equal(login.status, 200);
    const token = login.body.token;
    assert.ok(token);
    assert.equal((await request('/auth/login', 'GET', undefined, token)).body.id, owner.body.id);
    assert.equal((await request('/auth/login')).status, 401);
    assert.equal((await request('/auth/login', 'GET', undefined, `${token}tampered`)).status, 401);
    assert.equal((await request('/users', 'POST', ownerData, token)).status, 403);

    const guestData = { name: 'Guest', email: 'guest@example.com', password: 'secret456', type: 'regular' };
    const guest = await request('/users', 'POST', guestData);
    const guestToken = (await request('/auth/login', 'POST', guestData)).body.token;
    const data = {
      title: 'Apartment in Paris', description: 'Spacious apartment in the city center',
      date: '2026-01-01', city: 'Paris', previewImage: 'preview.jpg',
      images: Array(6).fill('photo.jpg'), isPremium: true, type: 'apartment',
      rooms: 2, guests: 3, price: 150, amenities: ['Breakfast'], author: guest.body.id,
      latitude: 48.85661, longitude: 2.351499,
    };
    assert.equal((await request('/offers', 'POST', data)).status, 401);
    const offer = await request('/offers', 'POST', data, token);
    assert.equal(offer.status, 201);
    const id = offer.body.id;
    assert.equal(offer.body.author.id, owner.body.id);
    assert.equal(offer.body.author.passwordHash, undefined);
    assert.equal((await request(`/offers/${id}`)).status, 200);
    const list = await request('/offers');
    assert.equal(list.status, 200);
    assert.equal(list.body.length, 1);
    assert.equal(list.body[0].description, undefined);
    assert.equal((await request('/offers/premium?city=Paris')).body.length, 1);
    assert.equal((await request('/offers/favorites')).status, 401);
    assert.equal((await request('/offers?count=-1')).status, 400);
    assert.equal((await request('/offers/invalid-id')).status, 400);
    assert.equal((await request('/offers/000000000000000000000000')).status, 404);
    assert.equal((await request(`/offers/${id}`, 'PATCH', { price: 200 }, guestToken)).status, 403);
    assert.equal((await request(`/offers/${id}`, 'PATCH', { price: 200 }, token)).body.price, 200);
    assert.equal((await request(`/offers/${id}/favorite`, 'POST', undefined, guestToken)).body.isFavorite, true);
    assert.equal((await request('/offers/favorites', 'GET', undefined, guestToken)).body.length, 1);
    assert.equal((await request('/offers/favorites', 'GET', undefined, token)).body.length, 0);
    assert.equal((await request(`/offers/${id}/favorite`, 'DELETE', undefined, guestToken)).body.isFavorite, false);
    assert.equal((await request(`/offers/${id}`, 'DELETE', undefined, guestToken)).status, 403);
    const removed = await request(`/offers/${id}`, 'DELETE', undefined, token);
    assert.equal(removed.status, 204);
    assert.equal(removed.body, null);
    assert.equal((await request(`/offers/${id}`, 'DELETE', undefined, token)).status, 404);
    assert.equal((await request(`/offers/${id}/comments`)).status, 404);
  } finally {
    await mongoose.connection.dropDatabase();
    await application.close();
  }
});
