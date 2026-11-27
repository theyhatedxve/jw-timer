import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAppResetService } from '../src/backend/services/appResetService';

function fixture() {
  let pending = false;
  let failBegin = false;
  let failClear = false;
  let failFinish = false;
  let data = ['profile', 'programs', 'preferences', 'checkpoint'];
  const service = createAppResetService({
    isPending: () => pending,
    begin() {
      if (failBegin) throw new Error('marker unavailable');
      pending = true;
    },
    clear() {
      assert.equal(pending, true);
      data = data.filter(item => item === 'checkpoint');
      if (failClear) throw new Error('timer database busy');
      data = [];
    },
    finish() {
      assert.deepEqual(data, []);
      if (failFinish) throw new Error('marker busy');
      pending = false;
    },
  });
  return {
    service,
    data: () => data,
    failBegin: (value: boolean) => { failBegin = value; },
    failClear: (value: boolean) => { failClear = value; },
    failFinish: (value: boolean) => { failFinish = value; },
  };
}

test('checking normal startup preserves data', () => {
  const f = fixture();
  assert.equal(f.service.isPending(), false);
  assert.equal(f.data().length, 4);
});

test('successful reset clears all stores before clearing pending marker', () => {
  const f = fixture();
  assert.equal(f.service.reset(), true);
  assert.deepEqual(f.data(), []);
  assert.equal(f.service.isPending(), false);
});

test('marker failure leaves app data untouched', () => {
  const f = fixture();
  f.failBegin(true);
  assert.equal(f.service.reset(), false);
  assert.equal(f.data().length, 4);
});

test('partial reset remains pending and startup can finish it', () => {
  const f = fixture();
  f.failClear(true);
  assert.equal(f.service.reset(), false);
  assert.equal(f.service.isPending(), true);
  assert.deepEqual(f.data(), ['checkpoint']);
  f.failClear(false);
  assert.equal(f.service.reset(), true);
  assert.equal(f.service.isPending(), false);
  assert.deepEqual(f.data(), []);
});

test('retry is safe when deletion finished but marker removal failed', () => {
  const f = fixture();
  f.failFinish(true);
  assert.equal(f.service.reset(), false);
  assert.equal(f.service.isPending(), true);
  f.failFinish(false);
  assert.equal(f.service.reset(), true);
  assert.equal(f.service.isPending(), false);
});
