import {
  validateProfile,
  type LocalProfile,
  type ProfileDraft,
  type ProfileResult,
} from '../domain/profile/profile';

export interface ProfileRepository {
  read(): ProfileResult<LocalProfile | null>;

  save(
    draft: ProfileDraft,
    expectedRevision: number | null,
  ): ProfileResult<LocalProfile>;
}

export interface ProfileService {
  load(): ProfileResult<LocalProfile | null>;

  save(
    input: unknown,
    expectedRevision: number | null,
  ): ProfileResult<LocalProfile>;
}

export function createProfileService(
  repository: ProfileRepository,
): ProfileService {
  return {
    load: () => repository.read(),

    save(input, expectedRevision) {
      const validated = validateProfile(input);

      if (!validated.ok) return validated;

      if (
        expectedRevision !== null &&
        (!Number.isSafeInteger(expectedRevision) ||
          expectedRevision < 1)
      ) {
        return { ok: false, code: 'corrupt' };
      }

      return repository.save(
        validated.value,
        expectedRevision,
      );
    },
  };
}