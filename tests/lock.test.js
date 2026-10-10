const test = require('node:test');
const assert = require('node:assert/strict');
const GenderLock = require('../js/lock.js');

test('a created lock verifies the right password only', async () => {
  const lock = await GenderLock.create('love2026');
  assert.equal(lock.algo, 'sha256');
  assert.ok(!JSON.stringify(lock).includes('love2026'));
  assert.equal(await GenderLock.verify(lock, 'love2026'), true);
  assert.equal(await GenderLock.verify(lock, 'love2027'), false);
  assert.equal(await GenderLock.verify(lock, ''), false);
});

test('the same password gets a different salt each time', async () => {
  const a = await GenderLock.create('1234');
  const b = await GenderLock.create('1234');
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.hash, b.hash);
});

test('fallback (no WebCrypto) locks verify too', async () => {
  const lock = await GenderLock.create('love2026', 'cyrb53');
  assert.equal(lock.algo, 'cyrb53');
  assert.equal(await GenderLock.verify(lock, 'love2026'), true);
  assert.equal(await GenderLock.verify(lock, 'love2025'), false);
});

test('verify without a lock is false', async () => {
  assert.equal(await GenderLock.verify(null, '1234'), false);
});

test('checkNewPassword enforces length and confirmation', () => {
  assert.match(GenderLock.checkNewPassword('12', '12'), /至少/);
  assert.match(GenderLock.checkNewPassword('1234', '1235'), /不一致/);
  assert.equal(GenderLock.checkNewPassword('1234', '1234'), '');
});
