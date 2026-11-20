import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from './src/constants/theme';
import { ProfileProvider } from './src/context/ProfileContext';
import AppNavigator from './src/navigation/AppNavigator';
import { linking } from './src/navigation/linking';
import { profileService } from './src/state/profile/profileDependencies';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.canvas,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.brand,
  },
};

export default function App() {
  return <SafeAreaProvider>
    <StatusBar style="light" />
    <ProfileProvider service={profileService}>
      <NavigationContainer theme={navigationTheme} linking={linking}>
        <AppNavigator />
      </NavigationContainer>
    </ProfileProvider>
  </SafeAreaProvider>;
}
