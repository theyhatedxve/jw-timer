import {
  isPublisherRole,
  validPublisherId,
  type PublisherDraft,
  type PublisherRole,
} from '../publishers/publisher';
import { isCalendarDate } from '../meetings/meetingValidation';

export interface Assignment {
  readonly meetingId: string;
  readonly partId: string;
  readonly role: PublisherRole;
  readonly publisherId: string | null;
  readonly revision: number;
}

export interface AssignmentCommand {
  readonly meetingId: string;
  readonly partId: string;
  readonly role: PublisherRole;
  readonly publisherId: string | null;
  readonly meetingRevision: number;
  readonly expectedRevision: number;
}

export type ScheduleResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly error: { readonly field: string; readonly message: string };
    };

export function canAssign(
  publisher: Pick<PublisherDraft, 'isActive' | 'roles'>,
  role: PublisherRole,
): boolean {
  return publisher.isActive && publisher.roles.includes(role);
}

export function meetingWeek(date: string): string {
  if (!isCalendarDate(date)) throw new Error('Invalid meeting date.');
  const value = new Date(`${date}T00:00:00.000Z`);
  const offset = (value.getUTCDay() + 6) % 7;
  value.setUTCDate(value.getUTCDate() - offset);
  return value.toISOString().slice(0, 10);
}

export function validateAssignment(input: unknown): ScheduleResult<AssignmentCommand> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: { field: 'assignment', message: 'Invalid assignment.' } };
  }
  const value = input as Record<string, unknown>;
  if (
    !validPublisherId(value.meetingId) ||
    !validPublisherId(value.partId) ||
    !isPublisherRole(value.role) ||
    (value.publisherId !== null && !validPublisherId(value.publisherId)) ||
    typeof value.meetingRevision !== 'number' ||
    !Number.isSafeInteger(value.meetingRevision) || value.meetingRevision < 1 ||
    typeof value.expectedRevision !== 'number' ||
    !Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0 ||
    value.expectedRevision >= Number.MAX_SAFE_INTEGER
  ) {
    return { ok: false, error: { field: 'assignment', message: 'The assignment information is invalid.' } };
  }
  return {
    ok: true,
    value: {
      meetingId: value.meetingId,
      partId: value.partId,
      role: value.role,
      publisherId: value.publisherId,
      meetingRevision: value.meetingRevision,
      expectedRevision: value.expectedRevision,
    },
  };
}
