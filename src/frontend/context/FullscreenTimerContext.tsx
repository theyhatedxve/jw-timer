import { createContext, useContext, useState, type ReactNode } from 'react';

import {
  DEFAULT_FULLSCREEN_TIMER,
  type FullscreenTimerPreferences,
} from '../../backend/domain/timer/fullscreenTimer';
import type { FullscreenTimerService } from '../../backend/services/fullscreenTimerService';

interface Value {
  readonly preferences: FullscreenTimerPreferences;
  readonly loadFailed: boolean;
  save(value: FullscreenTimerPreferences): boolean;
  reload(): FullscreenTimerPreferences | null;
}

const FullscreenTimerContext = createContext<Value | null>(null);

export function FullscreenTimerProvider({
  service,
  children,
}: {
  readonly service: FullscreenTimerService;
  readonly children: ReactNode;
}) {
  const [state, setState] = useState(() => {
    const result = service.load();
    return {
      preferences: result.ok ? result.value : DEFAULT_FULLSCREEN_TIMER,
      loadFailed: !result.ok,
    };
  });

  function save(value: FullscreenTimerPreferences): boolean {
    const result = service.save(value);
    if (!result.ok) return false;
    setState({ preferences: result.value, loadFailed: false });
    return true;
  }

  function reload(): FullscreenTimerPreferences | null {
    const result = service.load();
    if (!result.ok) return null;
    setState({ preferences: result.value, loadFailed: false });
    return result.value;
  }

  return (
    <FullscreenTimerContext.Provider value={{ ...state, save, reload }}>
      {children}
    </FullscreenTimerContext.Provider>
  );
}

export function useFullscreenTimer() {
  const value = useContext(FullscreenTimerContext);
  if (!value) throw new Error('FullscreenTimerProvider is required');
  return value;
}
