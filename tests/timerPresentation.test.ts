import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createTimer,
  next,
  pause,
  start,
} from '../src/backend/domain/timer/timer';

import { timerProgressPercent } from '../src/frontend/utils/timerPresentation';

test('Ready has no elapsed progress', () => {
  assert.equal(timerProgressPercent(createTimer(1000), 5000), 0);
});

test('running progress uses the existing monotonic timer', () => {
  const timer = start(createTimer(1000), 100);

  assert.equal(timerProgressPercent(timer, 350), 25);
  assert.equal(timerProgressPercent(timer, 1099), 99);
});

test('paused progress does not grow while paused', () => {
  const timer = pause(start(createTimer(1000), 100), 350);

  assert.equal(timerProgressPercent(timer, 5000), 25);
});

test('zero and overtime cap visual progress without changing timer state', () => {
  const timer = start(createTimer(1000), 100);
  const original = { ...timer };

  assert.equal(timerProgressPercent(timer, 1100), 100);
  assert.equal(timerProgressPercent(timer, 5100), 100);
  assert.deepEqual(timer, original);
});

test('finishing early does not pretend all allotted time elapsed', () => {
  const timer = next(start(createTimer(1000), 100), 350, [1000]);

  assert.equal(timer.status, 'completed');
  assert.equal(timerProgressPercent(timer, 5000), 25);
});
