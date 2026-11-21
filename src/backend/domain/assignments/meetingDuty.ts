import type { PublisherRole } from '../publishers/publisher';

export const MEETING_DUTY_SLOTS = [
  { key: 'sound', role: 'sound' },
  { key: 'timer', role: 'timer' },
  { key: 'attendant', role: 'attendant' },
  { key: 'microphone-left', role: 'microphones' },
  { key: 'microphone-right', role: 'microphones' },
] as const satisfies readonly {
  key: string;
  role: PublisherRole;
}[];

export type MeetingDutyKey =
  typeof MEETING_DUTY_SLOTS[number]['key'];

export interface MeetingDuty {
  readonly meetingId: string;
  readonly key: MeetingDutyKey;
  readonly publisherId: string | null;
  readonly revision: number;
}

export function isMeetingDutyKey(
  value: unknown,
): value is MeetingDutyKey {
  return MEETING_DUTY_SLOTS.some(slot => slot.key === value);
}