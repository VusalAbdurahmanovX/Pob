import test from 'node:test';
import assert from 'node:assert/strict';
import { getChallenge, SIZES } from './challenge.js';

test('every account has valid pricing and the two-step discount', () => {
  for (const size of SIZES) {
    const one = getChallenge(size, 1);
    const two = getChallenge(size, 2);
    assert.ok(one.fee > 0);
    assert.equal(two.fee, Math.round(one.fee * 0.8));
    assert.equal(one.target, '10%');
    assert.equal(two.target, '8% / 5%');
  }
  assert.equal(getChallenge(100000, 1).fee, 499);
});

test('invalid challenge selections are rejected', () => {
  for (const [size, mode] of [[0, 1], [100000, 3], ['100000', 1], [10000, NaN], [10000, '1']]) {
    assert.throws(() => getChallenge(size, mode), RangeError);
  }
});
