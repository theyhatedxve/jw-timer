export const APPEARANCE_OPTIONS = ['system', 'light', 'dark'] as const;

export type AppearancePreference = typeof APPEARANCE_OPTIONS[number];

export type AppearanceResult =
  | { readonly ok: true; readonly value: AppearancePreference }
  | { readonly ok: false };

export interface AppearanceRepository {
  read(): unknown;
  write(preference: AppearancePreference): void;
}

function isPreference(value: unknown): value is AppearancePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function createAppearanceService(repository: AppearanceRepository) {
  return {
    load(): AppearanceResult {
      try {
        const value = repository.read();

        if (value === null) {
          return { ok: true, value: 'system' };
        }

        return isPreference(value)
          ? { ok: true, value }
          : { ok: false };
      } catch {
        return { ok: false };
      }
    },

    save(value: unknown): AppearanceResult {
      if (!isPreference(value)) return { ok: false };

      try {
        repository.write(value);
        return { ok: true, value };
      } catch {
        return { ok: false };
      }
    },
  };
}

export type AppearanceService = ReturnType<typeof createAppearanceService>;
