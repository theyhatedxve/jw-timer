import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mayReadSchedule,
  parseReadGrantCommand,
  type ReadGrant,
} from '../src/backend/domain/devices/devicePermissions';

const owner = `sha256:${'a'.repeat(64)}`;
const peer = `sha256:${'b'.repeat(64)}`;
const congregationId = 'c'.repeat(32);

const grant: ReadGrant = {
  congregationId,
  peerFingerprint: peer,
  issuerFingerprint: owner,
  permission: 'schedule.read',
  peerRevision: 2,
  enabled: true,
  revision: 1,
  expiresAt: null,
};

const request = {
  ownerFingerprint: owner,
  peerFingerprint: peer,
  currentCongregationId: congregationId,
  requestedCongregationId: congregationId,
  permission: 'schedule.read',
  peer: { state: 'trusted', revision: 2 },
  grant,
  now: 1000,
};

test('allows an explicit matching read grant', () => {
  assert.equal(mayReadSchedule(request), true);
});

test('denies missing and disabled grants', () => {
  assert.equal(mayReadSchedule({ ...request, grant: null }), false);
  assert.equal(mayReadSchedule({
    ...request,
    grant: { ...grant, enabled: false },
  }), false);
});

test('denies pending, revoked, and re-paired devices', () => {
  for (const device of [
    { state: 'pending', revision: 2 },
    { state: 'revoked', revision: 3 },
    { state: 'trusted', revision: 4 },
  ]) {
    assert.equal(
      mayReadSchedule({ ...request, peer: device }),
      false,
    );
  }
});

test('denies other congregations and elevated operations', () => {
  assert.equal(mayReadSchedule({
    ...request,
    requestedCongregationId: 'd'.repeat(32),
  }), false);

  for (const permission of [
    'schedule.draft',
    'schedule.publish',
    'devices.manage',
    '*',
  ]) {
    assert.equal(
      mayReadSchedule({ ...request, permission }),
      false,
    );
  }
});

test('denies expired grants and incorrect issuers', () => {
  assert.equal(mayReadSchedule({
    ...request,
    grant: { ...grant, expiresAt: 1000 },
  }), false);

  assert.equal(mayReadSchedule({
    ...request,
    grant: { ...grant, issuerFingerprint: peer },
  }), false);
});

test('rejects attempts to inject another permission', () => {
  assert.throws(() => parseReadGrantCommand({
    congregationId,
    peerFingerprint: peer,
    peerRevision: 2,
    grantRevision: 0,
    enabled: true,
    permission: 'schedule.publish',
  }));
});