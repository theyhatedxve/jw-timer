import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { colors } from '../../constants/theme';
import { en } from '../../constants/strings/en';

import {
  runSqliteDiagnostics,
} from '../../backend/database/diagnostics/sqliteDiagnostics';

import ProfileBoundary from '../components/common/ProfileBoundary';
import { useLocalProfile } from '../hooks/useLocalProfile';

import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import MeetingEditorScreen from '../screens/MeetingEditorScreen';
import MeetingsScreen from '../screens/MeetingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TimerSessionScreen from '../screens/TimerSessionScreen';

import TabNavigator from './TabNavigator';
import ManageAssignmentsScreen from '../screens/ManageAssignmentsScreen';
import PublishersScreen from '../screens/PublishersScreen';

import PublisherEditorScreen from '../screens/PublisherEditorScreen';
import { publisherEn } from '../../constants/strings/publisherEn';

import MeetingDutiesScreen from '../screens/MeetingDutiesScreen';
import { meetingDutyEn } from '../../constants/strings/meetingDutyEn';

import WorkbookImportScreen from '../screens/WorkbookImportScreen';
import { workbookImportEn } from '../../constants/strings/workbookImportEn';
import BackupsScreen from '../screens/BackupsScreen';
import { backupEn } from '../../constants/strings/backupEn';
import BackupChecksScreen from '../screens/BackupChecksScreen';
import { runBackupChecks } from '../../backend/database/diagnostics/backupDiagnostics';
import { backupChecksEn } from '../../constants/strings/backupChecksEn';

import DeviceIdentityScreen from '../screens/DeviceIdentityScreen';
import { deviceIdentityEn } from '../../constants/strings/deviceIdentityEn';

import DeviceRequestsScreen from '../screens/DeviceRequestsScreen';
import { deviceRequestsEn } from '../../constants/strings/deviceRequestsEn';
import SignedPairingScreen from '../screens/SignedPairingScreen';
import { signedPairingEn } from '../../constants/strings/signedPairingEn';

import type {
  RootStackParamList,
} from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

const getPracticeTimerId = () => 'local-practice-timer';

export default function AppNavigator() {
  const { state, reload } = useLocalProfile();

  if (state.status !== 'ready') {
    return (
      <ProfileBoundary
        state={state}
        onRetry={reload}
      />
    );
  }

  const hasProfile = state.profile !== null;

  return (
    <Root.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: colors.canvas,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.canvas,
        },
      }}
    >
      {hasProfile ? (
        <Root.Group navigationKey="configured">
          <Root.Screen
            name="Main"
            component={TabNavigator}
          />
          <Root.Screen
            name="SignedPairing"
            component={SignedPairingScreen}
            getId={({ params }) => params.fingerprint}
            options={{
              headerShown: true,
              title: signedPairingEn.title,
            }}
          />
          <Root.Screen
            name="ManageAssignments"
            component={ManageAssignmentsScreen}
            options={{ headerShown: true, title: meetingDutyEn.title }}
          />
          <Root.Screen
            name="Publishers"
            component={PublishersScreen}
            options={{ headerShown: true, title: meetingDutyEn.publishers }}
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
            component={MeetingsScreen}
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

          <Root.Screen
            name="EditProfile"
            component={ProfileScreen}
          />

          <Root.Screen
            name="PracticeTimer"
            component={TimerSessionScreen}
            getId={getPracticeTimerId}
          />

          <Root.Screen name="Diagnostics">
            {() => (
              <DiagnosticsScreen
                runChecks={runSqliteDiagnostics}
              />
            )}
          </Root.Screen>

          <Root.Screen
            name="PublisherEditor"
            component={PublisherEditorScreen}
            getId={({ params }) => params?.publisherId ?? 'new'}
            options={{
              headerShown: true,
              title: publisherEn.editorTitle,
            }}
          />

          <Root.Screen
            name="MeetingDuties"
            component={MeetingDutiesScreen}
            getId={({ params }) => params.meetingId}
            options={{
              headerShown: true,
              title: meetingDutyEn.title,
            }}
          />
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

                    <Root.Screen
            name="DeviceIdentity"
            component={DeviceIdentityScreen}
            options={{
              headerShown: true,
              title: deviceIdentityEn.title,
            }}
          />
          <Root.Screen
            name="DeviceRequests"
            component={DeviceRequestsScreen}
            options={{
              headerShown: true,
              title: deviceRequestsEn.title,
            }}
          />
        </Root.Group>
      ) : (
        <Root.Screen
          name="SetupProfile"
          component={ProfileScreen}
        />
      )}
    </Root.Navigator>
  );
}
