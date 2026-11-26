import './global.css';

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  AppearanceProvider,
  useAppTheme,
} from './src/frontend/context/AppearanceContext';
import { FullscreenTimerProvider } from './src/frontend/context/FullscreenTimerContext';
import { fullscreenTimerService } from './src/bootstrap/fullscreenTimerDependencies';
import { ProfileProvider } from './src/frontend/context/ProfileContext';
import AppNavigator from './src/frontend/navigation/AppNavigator';
import { linking } from './src/frontend/navigation/linking';
import { profileService } from './src/bootstrap/profileDependencies';
import { appearanceService } from './src/bootstrap/appearanceDependencies';

function ThemedApplication() {
  const { resolved, palette } = useAppTheme();
  const base = resolved === 'dark' ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: palette.canvas,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      primary: palette.brand,
    },
  };

  return (
    <>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />

      <ProfileProvider service={profileService}>
        <NavigationContainer theme={navigationTheme} linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </ProfileProvider>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppearanceProvider service={appearanceService}>
        <FullscreenTimerProvider service={fullscreenTimerService}>
          <ThemedApplication />
        </FullscreenTimerProvider>
      </AppearanceProvider>
    </SafeAreaProvider>
  );
}
