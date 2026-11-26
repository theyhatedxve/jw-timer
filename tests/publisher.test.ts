import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  validatePublisherDraft,
} from '../src/backend/domain/legacy/publisher';

test('publisher names are trimmed and Unicode is preserved', () => {
  const result = validatePublisherDraft({
    displayName: '  José dela Cruz  ',
    isActive: true,
    roles: [],
  });

  assert.equal(result.ok, true);

  if (!result.ok) return;

  assert.equal(result.value.displayName, 'José dela Cruz');
});

test('empty and control-character names are rejected', () => {
  for (const displayName of ['', '   ', 'Name\nOther']) {
    assert.equal(
      validatePublisherDraft({
        displayName,
        isActive: true,
        roles: [],
      }).ok,
      false,
    );
  }
});

test('unknown and repeated responsibilities are rejected', () => {
  for (const roles of [
    ['unknown'],
    ['timer', 'timer'],
  ]) {
    assert.equal(
      validatePublisherDraft({
        displayName: 'Publisher',
        isActive: true,
        roles,
      }).ok,
      false,
    );
  }
});

test('responsibilities have a consistent canonical order', () => {
  const result = validatePublisherDraft({
    displayName: 'Publisher',
    isActive: true,
    roles: ['timer', 'prayer'],
  });

  assert.equal(result.ok, true);

  if (!result.ok) return;

  assert.deepEqual(result.value.roles, ['prayer', 'timer']);
});

test('inactive publishers retain selected responsibilities', () => {
  const result = validatePublisherDraft({
    displayName: 'Publisher',
    isActive: false,
    roles: ['sound'],
  });

  assert.equal(result.ok, true);

  if (!result.ok) return;

  assert.equal(result.value.isActive, false);
  assert.deepEqual(result.value.roles, ['sound']);
});

test('active status must be a boolean', () => {
  assert.equal(
    validatePublisherDraft({
      displayName: 'Publisher',
      isActive: 'true',
      roles: [],
    }).ok,
    false,
  );
});
