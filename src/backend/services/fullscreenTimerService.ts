import {
  DEFAULT_FULLSCREEN_TIMER,
  isFullscreenTimerPreferences,
  type FullscreenTimerPreferences,
} from '../domain/timer/fullscreenTimer';

type Result =
  | { readonly ok: true; readonly value: FullscreenTimerPreferences }
  | { readonly ok: false };

function validated(value: unknown): Result {
  if (!isFullscreenTimerPreferences(value)) return { ok: false };
  return {
    ok: true,
    value: {
      textSize: value.textSize,
      background: value.background,
      digits: value.digits,
      overtime: value.overtime,
      showCurrentPart: value.showCurrentPart,
      showProgress: value.showProgress,
    },
  };
}

export function createFullscreenTimerService(repository: {
  read(): unknown;
  write(value: FullscreenTimerPreferences): void;
}) {
  return {
    load(): Result {
      try {
        const value = repository.read();
        return validated(value === null ? DEFAULT_FULLSCREEN_TIMER : value);
      } catch {
        return { ok: false };
      }
    },
    save(value: unknown): Result {
      const result = validated(value);
      if (!result.ok) return result;
      try {
        repository.write(result.value);
        return result;
      } catch {
        return { ok: false };
      }
    },
  };
}

export type FullscreenTimerService = ReturnType<typeof createFullscreenTimerService>;
