import type { FullscreenTimerPreferences } from '../../backend/domain/timer/fullscreenTimer';
import { fullscreenPresentation } from '../../constants/timerTheme';

import {
  elapsed,
  type TimerState,
} from '../../backend/domain/timer/timer';

export function timerProgressPercent(
  timer: TimerState,
  nowMs: number,
): number {
  return Math.floor(Math.min(
    100,
    Math.max(0, elapsed(timer, nowMs) / timer.durationMs * 100),
  ));
}

/** Clock hands display the same whole-second countdown as the digital timer. */
export function countdownDialHands(remainingMs: number) {
  const seconds = remainingMs > 0 ? Math.ceil(remainingMs / 1000) : Math.floor(Math.abs(remainingMs) / 1000);
  return {
    minuteAngle: (seconds / 60 % 60) * 6,
    secondAngle: (seconds % 60) * 6,
    hours: Math.floor(seconds / 3600),
  };
}

/** Shade the remaining portion of the current part, including short timers. */
export function countdownDialFraction(remainingMs: number, durationMs: number): number {
  return Math.min(1, Math.max(0, remainingMs / durationMs));
}

export function fullscreenColors(preferences: FullscreenTimerPreferences) {
  return {
    background: preferences.background === 'theme' ? fullscreenPresentation.background : preferences.background,
    digits: preferences.digits === 'theme' ? fullscreenPresentation.text : preferences.digits,
    overtime: preferences.overtime === 'theme' ? fullscreenPresentation.overtime : preferences.overtime,
    remaining: preferences.remaining === 'theme' ? fullscreenPresentation.remaining : preferences.remaining,
    muted: preferences.digits === 'theme' ? fullscreenPresentation.muted : preferences.digits,
    track: preferences.digits === 'theme' ? fullscreenPresentation.track : preferences.digits + '44',
  };
}

/** Fit the measured digit region while reserving room for its caption and font scaling. */
export function fullscreenDigitSize(
  width: number,
  height: number,
  digits: string,
  fontScale: number,
  textSize: FullscreenTimerPreferences['textSize'],
): number {
  const scales = { small: 0.8, standard: 1, large: 1.25 } as const;
  const fit = Math.min(
    width / (Math.max(1, digits.length) * 0.62),
    Math.max(22, height - 32 * fontScale) / 1.1,
  ) / fontScale;
  return Math.max(22, fit * 0.8 * scales[textSize]);
}
