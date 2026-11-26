import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hexToHsv, hsvToHex } from '../src/frontend/utils/colorPicker';

import {
  DEFAULT_FULLSCREEN_TIMER,
  isFullscreenTimerPreferences,
} from '../src/backend/domain/timer/fullscreenTimer';
import { createFullscreenTimerService } from '../src/backend/services/fullscreenTimerService';

test('new installations use theme colors and visible fullscreen details', () => {
  const service = createFullscreenTimerService({
    read: () => null,
    write: () => { throw new Error('Load must not write'); },
  });
  assert.deepEqual(service.load(), { ok: true, value: DEFAULT_FULLSCREEN_TIMER });
});

test('saves and reloads custom fullscreen colors and visibility', () => {
  let stored: unknown = null;
  const service = createFullscreenTimerService({
    read: () => stored,
    write: value => { stored = JSON.parse(JSON.stringify(value)); },
  });
  const custom = {
    ...DEFAULT_FULLSCREEN_TIMER,
    textSize: 'large',
    background: '#000000',
    digits: '#FFFFFF',
    overtime: '#FF5555',
    showCurrentPart: false,
    showProgress: false,
  };
  assert.deepEqual(service.save({ ...custom, unexpected: 'discard this' }), { ok: true, value: custom });
  assert.deepEqual(stored, custom);
  assert.deepEqual(service.load(), { ok: true, value: custom });
  assert.deepEqual(service.save(DEFAULT_FULLSCREEN_TIMER), { ok: true, value: DEFAULT_FULLSCREEN_TIMER });
});

test('invalid preferences never replace saved customization', () => {
  let writes = 0;
  const service = createFullscreenTimerService({
    read: () => DEFAULT_FULLSCREEN_TIMER,
    write: () => { writes += 1; },
  });
  for (const value of [
    null, [],
    { ...DEFAULT_FULLSCREEN_TIMER, textSize: 'giant' },
    { ...DEFAULT_FULLSCREEN_TIMER, background: '#FFF' },
    { ...DEFAULT_FULLSCREEN_TIMER, digits: 'red' },
    { ...DEFAULT_FULLSCREEN_TIMER, overtime: '#FF000000' },
    { ...DEFAULT_FULLSCREEN_TIMER, showProgress: 'yes' },
  ]) {
    assert.equal(isFullscreenTimerPreferences(value), false);
    assert.deepEqual(service.save(value), { ok: false });
  }
  assert.equal(writes, 0);
});

test('storage failures and corrupt saved settings are reported', () => {
  const unavailable = createFullscreenTimerService({
    read: () => { throw new Error('Storage unavailable'); },
    write: () => { throw new Error('Storage unavailable'); },
  });
  assert.deepEqual(unavailable.load(), { ok: false });
  assert.deepEqual(unavailable.save(DEFAULT_FULLSCREEN_TIMER), { ok: false });

  const corrupt = createFullscreenTimerService({
    read: () => ({ textSize: 'large' }),
    write: () => undefined,
  });
  assert.deepEqual(corrupt.load(), { ok: false });
});


test('color picker converts primary colors, black, white, and hue wraparound', () => {
  assert.equal(hsvToHex({ h: 0, s: 1, v: 1 }), '#FF0000');
  assert.equal(hsvToHex({ h: 120, s: 1, v: 1 }), '#00FF00');
  assert.equal(hsvToHex({ h: 240, s: 1, v: 1 }), '#0000FF');
  assert.equal(hsvToHex({ h: 360, s: 1, v: 1 }), '#FF0000');
  assert.equal(hsvToHex({ h: 270, s: 1, v: 0 }), '#000000');
  assert.equal(hsvToHex({ h: 270, s: 0, v: 1 }), '#FFFFFF');
});

test('color picker preserves arbitrary saved hex colors when opened', () => {
  for (const hex of ['#FF5555', '#00C2C7', '#123456', '#A855F7', '#808080', '#000000', '#FFFFFF']) {
    assert.equal(hsvToHex(hexToHsv(hex)), hex);
  }
  assert.throws(() => hexToHsv('theme'));
  assert.throws(() => hexToHsv('#FFF'));
});
