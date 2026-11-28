export const FULLSCREEN_TIMER_SIZES = ['small', 'standard', 'large'] as const;
export type FullscreenTimerSize = typeof FULLSCREEN_TIMER_SIZES[number];

export const FULLSCREEN_TIMER_DISPLAYS = ['digital', 'hybrid', 'analog'] as const;
export type FullscreenTimerDisplay = typeof FULLSCREEN_TIMER_DISPLAYS[number];

export interface FullscreenTimerPreferences {
  readonly displayMode: FullscreenTimerDisplay;
  readonly textSize: FullscreenTimerSize;
  readonly background: string;
  readonly digits: string;
  readonly overtime: string;
  readonly remaining: string;
  readonly showCurrentPart: boolean;
  readonly showProgress: boolean;
}

export const DEFAULT_FULLSCREEN_TIMER: FullscreenTimerPreferences = {
  displayMode: 'digital',
  textSize: 'standard',
  background: 'theme',
  digits: 'theme',
  overtime: 'theme',
  remaining: 'theme',
  showCurrentPart: true,
  showProgress: true,
};

export function isTimerColor(value: unknown): value is string {
  return typeof value === 'string' && (value === 'theme' || /^#[0-9a-f]{6}$/i.test(value));
}

export function isFullscreenTimerPreferences(value: unknown): value is FullscreenTimerPreferences {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const preference = value as Record<string, unknown>;
  return (
    FULLSCREEN_TIMER_DISPLAYS.some(mode => mode === preference.displayMode) &&
    FULLSCREEN_TIMER_SIZES.some(size => size === preference.textSize) &&
    isTimerColor(preference.background) &&
    isTimerColor(preference.digits) &&
    isTimerColor(preference.overtime) &&
    isTimerColor(preference.remaining) &&
    typeof preference.showCurrentPart === 'boolean' &&
    typeof preference.showProgress === 'boolean'
  );
}
