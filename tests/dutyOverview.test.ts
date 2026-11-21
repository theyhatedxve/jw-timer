import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { ReviewMeeting } from '../src/backend/domain/assignments/dutyReview';
import type { SavedPublisher } from '../src/backend/services/publisherService';

import {
  buildDutyOverview,
  dutyEntriesForWeek,
} from '../src/frontend/utils/dutyOverview';

import { meetingDutyEn } from '../src/constants/strings/meetingDutyEn';
import { dutyReviewEn } from '../src/constants/strings/dutyReviewEn';

const publisher: SavedPublisher = {
  id: 'c'.repeat(32),
  revision: 1,
  updatedAt: 1,
  displayName: 'Test publisher',
  isActive: true,
  roles: ['sound'],
};

function meeting(
  id: string,
  date: string,
  timezone: string,
  start: string,
  end: string,
): ReviewMeeting {
  return {
    schedule: {
      id,
      title: id,
      meetingDate: date,
      startLocalTime: start,
      endLocalTime: end,
      timezone,
    },
    duties: [{
      meetingId: id,
      key: 'sound-operator',
      publisherId: publisher.id,
      revision: 1,
    }],
  };
}

test('week filtering preserves conflicts with meetings outside that week', () => {
  const first = meeting(
    'a'.repeat(32), '2026-11-29', 'UTC', '23:00', '23:59',
  );

  const second = meeting(
    'b'.repeat(32), '2026-11-30', 'Asia/Manila', '07:30', '08:30',
  );

  const reviewed = buildDutyOverview([first, second], [publisher]);
  const visible = dutyEntriesForWeek(reviewed, '2026-11-23');

  assert.equal(visible.length, 1);
  assert.equal(visible[0]?.id, first.schedule.id);

  assert.equal(
    visible[0]?.rows
      .find(row => row.key === 'sound-operator')
      ?.notices.includes(dutyReviewEn.conflict(second.schedule.title)),
    true,
  );
});

test('every meeting exposes exactly the four approved duty cards', () => {
  const target = meeting(
    'a'.repeat(32), '2026-11-23', 'UTC', '09:00', '10:00',
  );

  const entry = buildDutyOverview([target], [publisher])[0];

  assert.deepEqual(
    entry?.rows.map(row => row.key),
    [
      'mic-server',
      'sound-operator',
      'laptop-operator',
      'microphone-adjuster',
    ],
  );

  assert.equal(entry?.rows[0]?.name, meetingDutyEn.notAssigned);
  assert.equal(entry?.rows[1]?.name, publisher.displayName);
});

test('missing and inactive publishers retain review warnings', () => {
  const target = meeting(
    'a'.repeat(32), '2026-11-23', 'UTC', '09:00', '10:00',
  );

  for (const people of [[], [{ ...publisher, isActive: false }]]) {
    const entry = buildDutyOverview([target], people)[0];
    const row = entry?.rows.find(value => value.key === 'sound-operator');

    assert.equal(row?.notices.includes(dutyReviewEn.publisher), true);
  }
});

test('empty weeks return no invented assignments and preserve source order', () => {
  const first = meeting(
    'b'.repeat(32), '2026-11-24', 'UTC', '09:00', '10:00',
  );

  const second = meeting(
    'a'.repeat(32), '2026-11-23', 'UTC', '09:00', '10:00',
  );

  const entries = buildDutyOverview([first, second], [publisher]);
  const original = entries.map(entry => entry.id);

  assert.deepEqual(dutyEntriesForWeek(entries, '2026-12-07'), []);

  assert.deepEqual(
    dutyEntriesForWeek(entries, '2026-11-23').map(entry => entry.id),
    [second.schedule.id, first.schedule.id],
  );

  assert.deepEqual(entries.map(entry => entry.id), original);
});
