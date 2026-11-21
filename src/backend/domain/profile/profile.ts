export type ProgramLanguage = 'war' | 'en';

export interface ProfileDraft {
  readonly name: string;
  readonly timezone: string;
  readonly programLanguage: ProgramLanguage;
}

export interface LocalProfile extends ProfileDraft {
  readonly recordVersion: 1;
  readonly interfaceLanguage: 'en';
  readonly revision: number;
}

export type ProfileErrorCode =
  | 'name'
  | 'timezone'
  | 'language'
  | 'storage'
  | 'corrupt'
  | 'conflict';

export type ProfileResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly code: ProfileErrorCode };

export const PROFILE_LIMITS = {
  name: 100,
  timezone: 100,
  storedJson: 4096,
} as const;

export function validateProfile(
  input: unknown,
): ProfileResult<ProfileDraft> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, code: 'corrupt' };
  }

  const value = input as Record<string, unknown>;

  if (typeof value.name !== 'string') {
    return { ok: false, code: 'name' };
  }

  const name = value.name.trim();

  if (name.length === 0 || name.length > PROFILE_LIMITS.name) {
    return { ok: false, code: 'name' };
  }

  if (typeof value.timezone !== 'string') {
    return { ok: false, code: 'timezone' };
  }

  const timezone = value.timezone.trim();

  if (
    timezone.length > PROFILE_LIMITS.timezone ||
    !(timezone === 'UTC' || timezone.includes('/'))
  ) {
    return { ok: false, code: 'timezone' };
  }

  try {
    new Intl.DateTimeFormat('en', {
      timeZone: timezone,
    }).format(0);
  } catch {
    return { ok: false, code: 'timezone' };
  }

  if (
    value.programLanguage !== 'war' &&
    value.programLanguage !== 'en'
  ) {
    return { ok: false, code: 'language' };
  }

  return {
    ok: true,
    value: {
      name,
      timezone,
      programLanguage: value.programLanguage,
    },
  };
}

export function parseStoredProfile(
  input: unknown,
): ProfileResult<LocalProfile> {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, code: 'corrupt' };
  }

  const value = input as Record<string, unknown>;
  const draft = validateProfile(value);

  if (
    !draft.ok ||
    value.recordVersion !== 1 ||
    value.interfaceLanguage !== 'en' ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1
  ) {
    return { ok: false, code: 'corrupt' };
  }

  return {
    ok: true,
    value: {
      ...draft.value,
      recordVersion: 1,
      interfaceLanguage: 'en',
      revision: value.revision,
    },
  };
}