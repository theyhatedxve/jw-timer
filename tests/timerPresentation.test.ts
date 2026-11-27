import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createTimer,
  next,
  pause,
  start,
} from '../src/backend/domain/timer/timer';

import { timerProgressPercent, fullscreenColors, fullscreenDigitSize } from '../src/frontend/utils/timerPresentation';
import { DEFAULT_FULLSCREEN_TIMER } from '../src/backend/domain/timer/fullscreenTimer';

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

test('fullscreen defaults match the dark reference and preserve custom colors', () => {
  const defaults = fullscreenColors(DEFAULT_FULLSCREEN_TIMER);
  assert.equal(defaults.background, '#122C34');
  assert.equal(defaults.digits, '#FFFFFF');
  const custom = {
    ...DEFAULT_FULLSCREEN_TIMER,
    background: '#FFFFFF', digits: '#123456', overtime: '#A10020',
  };
  const original = { ...custom };
  const colors = fullscreenColors(custom);
  assert.equal(colors.background, '#FFFFFF');
  assert.equal(colors.digits, '#123456');
  assert.equal(colors.overtime, '#A10020');
  assert.deepEqual(custom, original);
});

test('fullscreen digit sizing fits portrait, landscape, overtime, and large text', () => {
  const small = fullscreenDigitSize(360, 300, '04:55', 1, 'small');
  const standard = fullscreenDigitSize(360, 300, '04:55', 1, 'standard');
  const large = fullscreenDigitSize(360, 300, '04:55', 1, 'large');
  assert.ok(small < standard && standard < large);
  assert.ok(large * 5 * 0.62 <= 360 + 1e-6);
  assert.ok(fullscreenDigitSize(360, 300, '+123:45', 1, 'standard') < standard);
  const scaled = fullscreenDigitSize(360, 300, '04:55', 1.3, 'standard');
  assert.ok(scaled < standard);
  assert.ok(scaled * 1.3 * 5 * 0.62 <= 360 + 1e-6);
  const landscape = fullscreenDigitSize(800, 160, '04:55', 1, 'large');
  assert.ok(landscape * 1.1 + 32 <= 160 + 1e-6);
});
