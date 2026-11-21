import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  reviewMeetingDuty,
  type ReviewMeeting,
} from '../src/backend/domain/assignments/dutyReview';

import type { PublisherDraft } from '../src/backend/domain/publishers/publisher';

const person: PublisherDraft = {
  displayName: 'Example Publisher',
  isActive: true,
  roles: ['sound'],
};

const meeting: ReviewMeeting = {
  schedule: {
    id: 'first',
    title: 'First meeting',
    meetingDate: '2026-11-25',
    startLocalTime: '18:30',
    endLocalTime: '20:00',
    timezone: 'Asia/Manila',
  },
  duties: [{
    meetingId: 'first',
    key: 'sound-operator',
    publisherId: 'publisher',
    revision: 1,
  }],
};

test('valid and unassigned duties have no notices', () => {
  assert.deepEqual(
    reviewMeetingDuty(meeting, 'sound-operator', person, [meeting]),
    [],
  );

  assert.deepEqual(
    reviewMeetingDuty(meeting, 'mic-server', null, [meeting]),
    [],
  );
});

test('flags missing, inactive, and ineligible publishers', () => {
  for (const publisher of [
    null,
    { ...person, isActive: false },
    { ...person, roles: [] },
  ]) {
    assert.equal(
      reviewMeetingDuty(
        meeting, 'sound-operator', publisher, [meeting],
      ).some(issue => issue.kind === 'publisher'),
      true,
    );
  }
});

test('flags another overlapping meeting for the same publisher', () => {
  const other: ReviewMeeting = {
    schedule: { ...meeting.schedule, id: 'second' },
    duties: meeting.duties.map(duty => ({
      ...duty,
      meetingId: 'second',
    })),
  };

  assert.deepEqual(
    reviewMeetingDuty(
      meeting, 'sound-operator', person, [meeting, other],
    ),
    [{ kind: 'conflict', meetingId: 'second' }],
  );
});

test('flags missing times and duplicate duties', () => {
  const changed: ReviewMeeting = {
    schedule: { ...meeting.schedule, endLocalTime: null },
    duties: [
      ...meeting.duties,
      {
        meetingId: 'first',
        key: 'mic-server',
        publisherId: 'publisher',
        revision: 1,
      },
    ],
  };

  const issues = reviewMeetingDuty(
    changed, 'sound-operator', person, [changed],
  );

  assert.equal(issues.some(issue => issue.kind === 'duplicate'), true);
  assert.equal(issues.some(issue => issue.kind === 'unverified'), true);
});