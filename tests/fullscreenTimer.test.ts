import assert from 'node:assert/strict';
import { test } from 'node:test';

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
