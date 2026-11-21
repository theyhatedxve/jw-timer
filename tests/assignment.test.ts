import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  canAssign,
  meetingWeek,
  validateAssignment,
} from '../src/backend/domain/assignments/assignment';

test('week grouping uses Monday without local-time conversion', () => {
  assert.equal(meetingWeek('2026-11-22'), '2026-11-16');
  assert.equal(meetingWeek('2026-11-23'), '2026-11-23');
});

test('inactive and ineligible publishers cannot be selected', () => {
  assert.equal(canAssign({ isActive: false, roles: ['timer'] }, 'timer'), false);
  assert.equal(canAssign({ isActive: true, roles: ['sound'] }, 'timer'), false);
  assert.equal(canAssign({ isActive: true, roles: ['timer'] }, 'timer'), true);
});

test('an assignment can explicitly be cleared', () => {
  const result = validateAssignment({
    meetingId: 'a'.repeat(32), partId: 'b'.repeat(32), role: 'timer',
    publisherId: null, meetingRevision: 1, expectedRevision: 2,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.publisherId, null);
});

test('invalid responsibility and revision inputs are rejected', () => {
  const command = {
    meetingId: 'a'.repeat(32), partId: 'b'.repeat(32), role: 'timer',
    publisherId: 'c'.repeat(32), meetingRevision: 1, expectedRevision: 0,
  };
  assert.equal(validateAssignment({ ...command, role: 'unknown' }).ok, false);
  assert.equal(validateAssignment({ ...command, expectedRevision: -1 }).ok, false);
});
