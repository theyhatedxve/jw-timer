import { useCallback, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type {
  HomeService,
  HomeSnapshot,
} from '../../backend/services/homeService';

export type HomeState =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | {
      readonly status: 'ready';
      readonly snapshot: HomeSnapshot;
    };

export function useHomeDashboard(service: HomeService) {
  const [state, setState] = useState<HomeState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      function refresh(): void {
        if (timer !== undefined) clearTimeout(timer);

        const result = service.load();

        if (!result.ok) {
          setState({ status: 'error' });
          return;
        }

        setState({ status: 'ready', snapshot: result.value });

        timer = setTimeout(
          refresh,
          Math.max(1000, result.value.refreshAt - Date.now()),
        );
      }

      refresh();

      const subscription = AppState.addEventListener('change', next => {
        if (next === 'active') refresh();
      });

      return () => {
        if (timer !== undefined) clearTimeout(timer);
        subscription.remove();
      };
    }, [service, attempt]),
  );

  return {
    state,
    reload: () => setAttempt(current => current + 1),
  };
}