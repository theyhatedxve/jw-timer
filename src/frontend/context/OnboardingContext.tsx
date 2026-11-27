import { createContext, useContext, useState, type ReactNode } from 'react';
import type { OnboardingService } from '../../backend/services/onboardingService';

type State = ReturnType<OnboardingService['load']>;
interface Value {
  readonly state: State;
  reload(): void;
  complete(): boolean;
}
const OnboardingContext = createContext<Value | null>(null);

export function OnboardingProvider({ service, children }: {
  readonly service: OnboardingService;
  readonly children: ReactNode;
}) {
  const [state, setState] = useState<State>(() => service.load());
  function complete(): boolean {
    if (!service.complete()) return false;
    setState({ ok: true, completed: true });
    return true;
  }
  return (
    <OnboardingContext.Provider value={{ state, reload: () => setState(service.load()), complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): Value {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('OnboardingProvider is required.');
  return value;
}
