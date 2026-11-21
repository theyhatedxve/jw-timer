import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme, View } from 'react-native';
import { vars } from 'nativewind';

import {
  appearancePalettes,
  type AppPalette,
} from '../../constants/appearanceTheme';

import type {
  AppearancePreference,
  AppearanceService,
} from '../../backend/services/appearanceService';

type Notice = 'saved' | 'load' | 'save' | null;

interface AppearanceState {
  readonly preference: AppearancePreference;
  readonly notice: Notice;
}

interface AppearanceContextValue extends AppearanceState {
  readonly resolved: 'light' | 'dark';
  readonly palette: AppPalette;
  choose(preference: AppearancePreference): void;
  reload(): void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({
  service,
  children,
}: {
  readonly service: AppearanceService;
  readonly children: ReactNode;
}) {
  const systemScheme = useColorScheme();

  function loadState(): AppearanceState {
    const result = service.load();

    return result.ok
      ? { preference: result.value, notice: null }
      : { preference: 'system', notice: 'load' };
  }

  const [state, setState] = useState<AppearanceState>(loadState);

  const resolved = state.preference === 'system'
    ? systemScheme ?? 'light'
    : state.preference;

  const palette = appearancePalettes[resolved];

  const variables = useMemo(() => vars({
    '--app-canvas': palette.canvas,
    '--app-surface': palette.surface,
    '--app-text': palette.text,
    '--app-secondary': palette.secondary,
    '--app-brand': palette.brand,
    '--app-on-brand': palette.onBrand,
    '--app-border': palette.border,
    '--app-danger': palette.danger,
  }), [palette]);

  function choose(preference: AppearancePreference): void {
    const result = service.save(preference);

    if (result.ok) {
      setState({ preference: result.value, notice: 'saved' });
    } else {
      setState(current => ({ ...current, notice: 'save' }));
    }
  }

  function reload(): void {
    const result = service.load();

    if (result.ok) {
      setState({ preference: result.value, notice: null });
    } else {
      setState(current => ({ ...current, notice: 'load' }));
    }
  }

  return (
    <AppearanceContext.Provider
      value={{ ...state, resolved, palette, choose, reload }}
    >
      <View className="flex-1 bg-app-canvas" style={variables}>
        {children}
      </View>
    </AppearanceContext.Provider>
  );
}

export function useAppTheme(): AppearanceContextValue {
  const value = useContext(AppearanceContext);

  if (!value) {
    throw new Error('AppearanceProvider is required');
  }

  return value;
}
