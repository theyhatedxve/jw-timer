import type { PublisherRole } from './publisher';

export const MEETING_DUTY_SLOTS = [
  { key: 'mic-server', role: 'microphones' },
  { key: 'sound-operator', role: 'sound' },
  { key: 'laptop-operator', role: 'laptop' },
  { key: 'microphone-adjuster', role: 'microphone-adjuster' },
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
