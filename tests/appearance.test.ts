import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAppearanceService } from '../src/backend/services/appearanceService';

test('missing preference defaults to System without writing', () => {
  const service = createAppearanceService({
    read: () => null,
    write: () => assert.fail('Loading must not write'),
  });

  assert.deepEqual(service.load(), { ok: true, value: 'system' });
});

test('loads each supported preference', () => {
  for (const value of ['system', 'light', 'dark']) {
    const service = createAppearanceService({
      read: () => value,
      write: () => assert.fail('Loading must not write'),
    });

    assert.deepEqual(service.load(), { ok: true, value });
  }
});

test('invalid stored data is reported without replacement', () => {
  for (const value of ['unexpected', {}, 1, undefined]) {
    const service = createAppearanceService({
      read: () => value,
      write: () => assert.fail('Invalid stored data must not be replaced'),
    });

    assert.deepEqual(service.load(), { ok: false });
  }
});

test('invalid selection never reaches storage', () => {
  const service = createAppearanceService({
    read: () => 'dark',
    write: () => assert.fail('Invalid selection must not be written'),
  });

  assert.deepEqual(service.save('unexpected'), { ok: false });
});

test('successful save persists the selected preference', () => {
  let stored: unknown = 'system';

  const service = createAppearanceService({
    read: () => stored,
    write: value => { stored = value; },
  });

  assert.deepEqual(service.save('dark'), { ok: true, value: 'dark' });
  assert.deepEqual(service.load(), { ok: true, value: 'dark' });
});

test('storage failures are reported instead of thrown', () => {
  const service = createAppearanceService({
    read: () => { throw new Error('Read failed'); },
    write: () => { throw new Error('Write failed'); },
  });

  assert.deepEqual(service.load(), { ok: false });
  assert.deepEqual(service.save('light'), { ok: false });
});
