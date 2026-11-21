import assert from 'node:assert/strict';
import { test } from 'node:test';

import { validateMeetingDraft } from '../src/backend/domain/meetings/meetingValidation';

const draft = {
  title: 'Midweek meeting',
  meetingType: 'midweek',
  meetingDate: '2026-11-25',
  startLocalTime: '18:30',
  timezone: 'Asia/Manila',
  programLanguage: 'en',
  sections: [],
};

test('older drafts normalize missing end time to null', () => {
  const result = validateMeetingDraft(draft);

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.endLocalTime, null);
});

test('accepts an end time later on the same date', () => {
  const result = validateMeetingDraft({
    ...draft,
    endLocalTime: '20:15',
  });

  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.endLocalTime, '20:15');
});

test('rejects invalid, reversed, or incomplete time ranges', () => {
  for (const endLocalTime of ['25:00', '', '18:30', '18:00']) {
    assert.equal(
      validateMeetingDraft({ ...draft, endLocalTime }).ok,
      false,
    );
  }

  assert.equal(
    validateMeetingDraft({
      ...draft,
      startLocalTime: null,
      endLocalTime: '20:15',
    }).ok,
    false,
  );
});