interface OnboardingRepository {
  read(): unknown;
  complete(): void;
}

export function createOnboardingService(repository: OnboardingRepository) {
  return {
    load(): { readonly ok: true; readonly completed: boolean } | { readonly ok: false } {
      try {
        const value = repository.read();
        if (value !== null && value !== true) return { ok: false };
        return { ok: true, completed: value === true };
      } catch {
        return { ok: false };
      }
    },
    complete(): boolean {
      try {
        repository.complete();
        return true;
      } catch {
        return false;
      }
    },
  };
}

export type OnboardingService = ReturnType<typeof createOnboardingService>;
