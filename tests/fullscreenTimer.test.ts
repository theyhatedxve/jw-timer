import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hexToHsv, hsvToHex } from '../src/frontend/utils/colorPicker';

import {
  DEFAULT_FULLSCREEN_TIMER,
  isFullscreenTimerPreferences,
} from '../src/backend/domain/timer/fullscreenTimer';
import { countdownDialHands } from '../src/frontend/utils/timerPresentation';
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

test('legacy fullscreen settings keep custom values and default to digital', () => {
  const legacy = {
    textSize: 'large',
    background: '#102030',
    digits: '#ABCDEF',
    overtime: '#FF0000',
    showCurrentPart: false,
    showProgress: false,
  };
  let writes = 0;
  const service = createFullscreenTimerService({
    read: () => legacy,
    write: () => { writes += 1; },
  });
  assert.deepEqual(service.load(), {
    ok: true,
    value: { ...legacy, displayMode: 'digital' },
  });
  assert.equal(writes, 0);
});

test('all fullscreen display choices survive saving and reloading', () => {
  let stored: unknown = null;
  const service = createFullscreenTimerService({
    read: () => stored,
    write: value => { stored = JSON.parse(JSON.stringify(value)); },
  });
  for (const displayMode of ['digital', 'hybrid', 'analog'] as const) {
    const value = { ...DEFAULT_FULLSCREEN_TIMER, displayMode };
    assert.deepEqual(service.save(value), { ok: true, value });
    assert.deepEqual(service.load(), { ok: true, value });
  }
});

test('invalid display choices fail without overwriting preferences', () => {
  let writes = 0;
  for (const displayMode of ['clock', null, undefined, 1]) {
    const invalid = { ...DEFAULT_FULLSCREEN_TIMER, displayMode };
    const service = createFullscreenTimerService({
      read: () => invalid,
      write: () => { writes += 1; },
    });
    assert.deepEqual(service.save(invalid), { ok: false });
    assert.deepEqual(service.load(), { ok: false });
  }
  assert.equal(writes, 0);
});

test('analog countdown hands match digital rounding, zero, overtime, and long parts', () => {
  const remaining = countdownDialHands(282_000);
  assert.ok(Math.abs(remaining.minuteAngle - 28.2) < 0.000001);
  assert.equal(remaining.secondAngle, 252);
  assert.equal(remaining.hours, 0);
  assert.deepEqual(countdownDialHands(1), {
    minuteAngle: 0.1, secondAngle: 6, hours: 0,
  });
  assert.deepEqual(countdownDialHands(0), {
    minuteAngle: 0, secondAngle: 0, hours: 0,
  });
  const overtime = countdownDialHands(-12_999);
  assert.ok(Math.abs(overtime.minuteAngle - 1.2) < 0.000001);
  assert.equal(overtime.secondAngle, 72);
  assert.equal(overtime.hours, 0);
  assert.deepEqual(countdownDialHands(3_600_000), {
    minuteAngle: 0, secondAngle: 0, hours: 1,
  });
  assert.deepEqual(countdownDialHands(86_400_000), {
    minuteAngle: 0, secondAngle: 0, hours: 24,
  });
});
