import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PROFILE_TEXT as text } from '../../../constants/strings/profileEn';

import { useAppTheme } from '../../context/AppearanceContext';
import type { ProfileState } from '../../context/ProfileContext';

import AppButton from './AppButton';
import AppScreen from './AppScreen';

export default function ProfileBoundary({
  state,
  onRetry,
}: {
  readonly state: ProfileState;
  readonly onRetry: () => void;
}) {
  const { palette } = useAppTheme();

  if (state.status === 'ready') return null;

  return (
    <SafeAreaView className="flex-1 bg-app-canvas">
      <AppScreen>
        <Text
          accessibilityRole="header"
          className="text-app-title font-bold text-app-text"
        >
          {text.title}
        </Text>
        {state.status === 'loading' ? (
          <>
            <ActivityIndicator color={palette.brand} />
            <Text
              accessibilityLiveRegion="polite"
              className="text-app-body text-app-secondary"
            >
              {text.loading}
            </Text>
          </>
        ) : (
          <>
            <Text
              accessibilityRole="alert"
              className="text-app-body text-app-danger"
            >
              {text.errors[state.code]}
            </Text>
            <AppButton label={text.retry} onPress={onRetry} />
          </>
        )}
      </AppScreen>
    </SafeAreaView>
  );
}
