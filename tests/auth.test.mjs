import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { AuthService } from '../dist/shared/modules/auth/auth.service.js';

test('Bearer tokens require valid signature, claims and expiration', () => {
  const secret = 'unit-test-token-secret';
  const auth = new AuthService({ get: () => secret });
  const userId = '0123456789abcdef01234567';
  const token = auth.createToken(userId);
  assert.equal(auth.verifyToken(token), userId);
  const unauthorized = (error) => error.statusCode === 401;
  assert.throws(() => auth.verifyToken(`${token}forged`), unauthorized);
  assert.throws(() => auth.verifyToken('malformed'), unauthorized);
  assert.throws(() => new AuthService({ get: () => 'other-secret' }).verifyToken(token), unauthorized);
  const [header] = token.split('.');
  function signClaims(claims) {
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const value = `${header}.${payload}`;
    return `${value}.${createHmac('sha256', secret).update(value).digest('base64url')}`;
  }
  assert.throws(() => auth.verifyToken(signClaims({ sub: userId, exp: 1 })), unauthorized);
  assert.throws(() => auth.verifyToken(signClaims({ sub: userId })), unauthorized);
  assert.throws(() => auth.verifyToken(signClaims({ sub: 'invalid', exp: Date.now() })), unauthorized);
});
