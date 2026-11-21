import { getAppDatabase } from '../appDatabase';
import { readMeetingForShare } from './meetingRepository';
import { readPublisherForBackup } from './publisherRepository';
import { parseStoredProfile } from '../../domain/profile/profile';
import { MEETING_DUTY_SLOTS, isMeetingDutyKey } from '../../domain/assignments/meetingDuty';
import { parseSyncDataset } from '../../domain/sync/syncCodec';
import { SYNC_LIMITS, SYNC_ROLES, SyncFailure, type SyncDataset } from '../../domain/sync/syncTypes';

export function captureSyncDataset(localScope: string): SyncDataset {
  const db = getAppDatabase();
  let result: SyncDataset | undefined;
  db.withTransactionSync(() => {
    const row = db.getFirstSync<{ value_json: string }>('SELECT value_json FROM app_preferences WHERE key = ?', 'local_profile');
    const profile = row ? parseStoredProfile(JSON.parse(row.value_json)) : null;
    if (!profile?.ok || profile.value.congregationId !== localScope) throw new SyncFailure('PROFILE_CHANGED');
    const publisherRows = db.getAllSync<{ id: string }>('SELECT id FROM local_publishers ORDER BY id LIMIT ?', SYNC_LIMITS.publishers + 1);
    const meetingRows = db.getAllSync<{ id: string }>('SELECT id FROM local_meeting_drafts ORDER BY meeting_date, id LIMIT ?', SYNC_LIMITS.meetings + 1);
    if (publisherRows.length > SYNC_LIMITS.publishers || meetingRows.length > SYNC_LIMITS.meetings) throw new SyncFailure('LIMIT');
    result = parseSyncDataset({
      version: 2, congregationId: localScope,
      publishers: publisherRows.map(({ id }) => {
        const person = readPublisherForBackup(db, id);
        if (!person) throw new SyncFailure('INVALID_DATA');
        return { id, displayName: person.displayName, isActive: person.isActive,
          roles: person.roles.filter(role => SYNC_ROLES.some(known => known === role)) };
      }),
      meetings: meetingRows.map(({ id }) => {
        const saved = readMeetingForShare(db, id);
        if (!saved) throw new SyncFailure('INVALID_DATA');
        const { importSource: _source, ...draft } = saved.draft;
        const duties = db.getAllSync<{ duty_key: string; publisher_id: string | null }>(
          'SELECT duty_key, publisher_id FROM local_technical_duties WHERE meeting_id = ?', id,
        );
        if (duties.some(duty => !isMeetingDutyKey(duty.duty_key))) throw new SyncFailure('INVALID_DATA');
        return { id, revision: saved.revision, draft,
          duties: MEETING_DUTY_SLOTS.map(slot => ({ key: slot.key,
            publisherId: duties.find(duty => duty.duty_key === slot.key)?.publisher_id ?? null })) };
      }),
    });
  });
  if (!result) throw new SyncFailure('NOT_FOUND');
  return result;
}
