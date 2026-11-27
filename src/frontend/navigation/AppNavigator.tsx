import { useEffect } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useOnboarding } from '../context/OnboardingContext';
import AppButton from '../components/common/AppButton';
import AppScreen from '../components/common/AppScreen';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';

import { useAppTheme } from '../context/AppearanceContext';
import { useLocalProfile } from '../hooks/useLocalProfile';
import ProfileBoundary from '../components/common/ProfileBoundary';

import AppearanceScreen from '../screens/AppearanceScreen';
import FullscreenTimerSettingsScreen from '../screens/FullscreenTimerSettingsScreen';
import NativewindPreviewScreen from '../screens/NativewindPreviewScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import MeetingEditorScreen from '../screens/MeetingEditorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TimerSessionScreen from '../screens/TimerSessionScreen';
import WorkbookImportScreen from '../screens/WorkbookImportScreen';
import BackupsScreen from '../screens/BackupsScreen';
import BackupChecksScreen from '../screens/BackupChecksScreen';

import { runSqliteDiagnostics } from '../../backend/database/diagnostics/sqliteDiagnostics';
import { runBackupChecks } from '../../backend/database/diagnostics/backupDiagnostics';

import { onboardingEn } from '../../constants/strings/onboardingEn';
import { appearanceEn } from '../../constants/strings/appearanceEn';
import { fullscreenTimerEn } from '../../constants/strings/fullscreenTimerEn';
import { nativewindPreviewEn } from '../../constants/strings/nativewindPreviewEn';
import { workbookImportEn } from '../../constants/strings/workbookImportEn';
import { backupEn } from '../../constants/strings/backupEn';
import { backupChecksEn } from '../../constants/strings/backupChecksEn';
import { en } from '../../constants/strings/en';

import TabNavigator from './TabNavigator';
import type { RootStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

const getPracticeTimerId = () => 'local-practice-timer';

function MeetingProgramsRedirect({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'MeetingPrograms'>) {
  useEffect(() => {
    navigation.popTo('Main', { screen: 'Meetings' });
  }, [navigation]);
  return null;
}

export default function AppNavigator() {
  const { palette: colors } = useAppTheme();
  const { state, reload } = useLocalProfile();
  const onboarding = useOnboarding();

  if (state.status !== 'ready') {
    return <ProfileBoundary state={state} onRetry={reload} />;
  }

  const hasProfile = state.profile !== null;
  if (!hasProfile && !onboarding.state.ok) {
    return (
      <SafeAreaView className="flex-1 bg-app-canvas">
        <AppScreen>
          <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">{onboardingEn.appName}</Text>
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">{onboardingEn.loadError}</Text>
          <AppButton label={onboardingEn.retry} onPress={onboarding.reload} />
        </AppScreen>
      </SafeAreaView>
    );
  }
  const canEnterApp = hasProfile || (onboarding.state.ok && onboarding.state.completed);

  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      {canEnterApp ? (
        <Root.Group navigationKey={hasProfile ? 'configured' : 'setup-later'}>
          <Root.Screen name="Main" component={TabNavigator} />

          {__DEV__ ? (
            <Root.Screen
              name="NativewindPreview"
              component={NativewindPreviewScreen}
              options={{
                headerShown: true,
                title: nativewindPreviewEn.title,
              }}
            />
          ) : null}

          <Root.Screen
            name="Appearance"
            component={AppearanceScreen}
            options={{
              headerShown: true,
              title: appearanceEn.title,
            }}
          />

          <Root.Screen
            name="FullscreenTimerSettings"
            component={FullscreenTimerSettingsScreen}
            options={{
              headerShown: true,
              title: fullscreenTimerEn.title,
            }}
          />

          <Root.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              title: en.navigation.settings,
            }}
          />

          <Root.Screen
            name="MeetingPrograms"
            component={MeetingProgramsRedirect}
            options={{
              headerShown: true,
              title: en.navigation.meetings,
            }}
          />

          <Root.Screen
            name="MeetingEditor"
            component={MeetingEditorScreen}
            getId={({ params }) =>
              params?.meetingId ?? params?.importKey ?? 'new'
            }
          />

          <Root.Screen name="EditProfile" component={ProfileScreen} />

          <Root.Screen
            name="PracticeTimer"
            component={TimerSessionScreen}
            getId={getPracticeTimerId}
          />

          <Root.Screen name="Diagnostics">
            {() => (
              <DiagnosticsScreen runChecks={runSqliteDiagnostics} />
            )}
          </Root.Screen>

          <Root.Screen
            name="WorkbookImport"
            component={WorkbookImportScreen}
            options={{
              headerShown: true,
              title: workbookImportEn.title,
            }}
          />

          <Root.Screen
            name="Backups"
            component={BackupsScreen}
            options={{
              headerShown: true,
              title: backupEn.title,
            }}
          />

          <Root.Screen
            name="BackupChecks"
            options={{
              headerShown: true,
              title: backupChecksEn.title,
            }}
          >
            {() => (
              <BackupChecksScreen runChecks={runBackupChecks} />
            )}
          </Root.Screen>
        </Root.Group>
      ) : (
        <Root.Group navigationKey="setup">
          <Root.Screen name="Onboarding" component={OnboardingScreen} />
          <Root.Screen name="SetupProfile" component={ProfileScreen} />
        </Root.Group>
      )}
    </Root.Navigator>
  );
}
