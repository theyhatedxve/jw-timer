import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  checkpoint, createTimer, elapsed, formatTime, isCheckpoint,
  next, pause, recover, restart, start,
} from '../src/backend/domain/timer/timer';

test('a loaded part stays ready until Start', () => {
  const ready = createTimer();
  assert.equal(ready.status, 'ready');
  assert.equal(elapsed(ready, 500_000), 0);
  assert.equal(elapsed(start(ready, 500_000), 501_000), 1000);
});

test('dropped render ticks do not lose elapsed time', () => {
  const running = start(createTimer(), 1000);
  assert.equal(elapsed(running, 61_000), 60_000);
});

test('zero retains the current part and continues overtime', () => {
  const running = start(createTimer(), 1000);
  assert.equal(elapsed(running, 11_000), 10_000);
  assert.equal(formatTime(running, 10_999), '00:01');
  assert.equal(formatTime(running, 11_000), '+00:00');
  assert.equal(formatTime(running, 11_001), '+00:00');
  assert.equal(formatTime(running, 13_000), '+00:02');
  assert.equal(running.partIndex, 0);
  assert.equal(running.status, 'running');
});

test('pause excludes paused time and Resume needs an explicit command', () => {
  const paused = pause(start(createTimer(), 1000), 4000);
  assert.equal(elapsed(paused, 100_000), 3000);
  assert.equal(elapsed(start(paused, 100_000), 102_000), 5000);
});

test('repeated Start cannot reset a running baseline', () => {
  const running = start(createTimer(), 1000);
  assert.equal(elapsed(start(running, 2000), 4000), 3000);
});

test('Next loads Ready and never starts the next part', () => {
  const second = next(start(createTimer(), 1000), 13_000);
  assert.equal(second.partIndex, 1);
  assert.equal(second.status, 'ready');
  assert.equal(elapsed(second, 50_000), 0);
  assert.equal(next(second, 50_000).status, 'completed');
});

test('recovery excludes time while closed and discards old clock baselines', () => {
  const saved = checkpoint(start(createTimer(), 500_000), 504_000, 1_000_000);
  assert.equal('startedAtMs' in saved, false);
  const restored = recover(saved);
  assert.equal(restored.status, 'paused');
  assert.equal(restored.startedAtMs, null);
  assert.equal(elapsed(restored, 20), 4000);
  assert.equal(elapsed(start(restored, 20), 1020), 5000);
});

test('Restart clears elapsed and waits for Start', () => {
  const ready = restart(start(createTimer(), 100));
  assert.equal(ready.status, 'ready');
  assert.equal(elapsed(ready, 500_000), 0);
});

test('negative monotonic delta never reduces accumulated elapsed', () => {
  const running = start(pause(start(createTimer(), 100), 1100), 2000);
  assert.equal(elapsed(running, 1000), 1000);
});

test('invalid stored checkpoint is rejected', () => {
  const saved = checkpoint(createTimer(), 0, 1000);
  assert.equal(isCheckpoint(saved), true);
  for (const invalid of [null, {}, { ...saved, partIndex: 2 },
    { ...saved, durationMs: -1 }, { ...saved, elapsedMs: NaN },
    { ...saved, status: 'unknown' }, { ...saved, status: ['running'] },
    { ...saved, status: { toString: () => 'running' } }, { ...saved, schemaVersion: 2 }]) {
    assert.equal(isCheckpoint(invalid), false);
  }
});
