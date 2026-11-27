import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOnboardingService } from '../src/backend/services/onboardingService';

test('fresh installation needs onboarding', () => {
  const service = createOnboardingService({ read: () => null, complete() {} });
  assert.deepEqual(service.load(), { ok: true, completed: false });
});

test('setup-later choice survives creating a new service', () => {
  let stored: unknown = null;
  const repository = { read: () => stored, complete() { stored = true; } };
  assert.equal(createOnboardingService(repository).complete(), true);
  assert.deepEqual(createOnboardingService(repository).load(), { ok: true, completed: true });
});

test('storage failures do not report completion', () => {
  const service = createOnboardingService({
    read: () => null,
    complete() { throw new Error('storage unavailable'); },
  });
  assert.equal(service.complete(), false);
  assert.deepEqual(service.load(), { ok: true, completed: false });
});

test('corrupt preferences stay errors instead of silently opening the app', () => {
  for (const value of [false, 'true', 1, {}, undefined]) {
    const service = createOnboardingService({ read: () => value, complete() {} });
    assert.deepEqual(service.load(), { ok: false });
  }
});

test('read failure stays retryable and does not write data', () => {
  let failed = true;
  let writes = 0;
  const service = createOnboardingService({
    read() { if (failed) throw new Error('locked'); return true; },
    complete() { writes += 1; },
  });
  assert.deepEqual(service.load(), { ok: false });
  failed = false;
  assert.deepEqual(service.load(), { ok: true, completed: true });
  assert.equal(writes, 0);
});

test('clearing preferences restores onboarding after setup was deferred', () => {
  let stored: unknown = true;
  const service = createOnboardingService({ read: () => stored, complete() { stored = true; } });
  assert.deepEqual(service.load(), { ok: true, completed: true });
  stored = null;
  assert.deepEqual(service.load(), { ok: true, completed: false });
});
