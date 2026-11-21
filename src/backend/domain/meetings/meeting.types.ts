export type MeetingType = 'midweek' | 'weekend';

export type MeetingLanguage = 'en' | 'war';

export type MeetingPartKind =
  | 'song'
  | 'prayer'
  | 'talk'
  | 'study'
  | 'comments'
  | 'custom'
  | 'other';

export interface MeetingPartDraft {
  readonly title: string;
  readonly kind: MeetingPartKind;
  readonly durationSeconds: number;
  readonly isTimed: boolean;
  readonly id?: string;
}

export interface MeetingSectionDraft {
  readonly title: string;
  readonly parts: readonly MeetingPartDraft[];
  readonly id?: string;
}

export interface MeetingDraft {
  readonly title: string;
  readonly meetingType: MeetingType;
  readonly meetingDate: string;
  readonly startLocalTime: string | null;
  readonly endLocalTime?: string | null;
  readonly timezone: string;
  readonly programLanguage: MeetingLanguage;
  readonly sections: readonly MeetingSectionDraft[];
}

export interface MeetingValidationError {
  readonly field: string;
  readonly message: string;
}

export type MeetingResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly error: MeetingValidationError;
    };