import AppearanceScreen from '../screens/AppearanceScreen';
import { appearanceEn } from '../../constants/strings/appearanceEn';
import NativewindPreviewScreen from '../screens/NativewindPreviewScreen';
import { nativewindPreviewEn } from '../../constants/strings/nativewindPreviewEn';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { useAppTheme } from '../context/AppearanceContext';
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
import ReceivedSchedulesScreen from '../screens/ReceivedSchedulesScreen';
import { receivedSchedulesEn } from '../../constants/strings/receivedSchedulesEn';
import DeviceRequestsScreen from '../screens/DeviceRequestsScreen';
import { deviceRequestsEn } from '../../constants/strings/deviceRequestsEn';
import SignedPairingScreen from '../screens/SignedPairingScreen';
import { signedPairingEn } from '../../constants/strings/signedPairingEn';
import DevicePermissionsScreen from '../screens/DevicePermissionsScreen';
import LanProbeScreen from '../screens/LanProbeScreen';
import { lanProbeEn } from '../../constants/strings/lanProbeEn';
import { devicePermissionsEn } from '../../constants/strings/devicePermissionsEn';
import SyncScreen from '../screens/SyncScreen';
import SyncChecksScreen from '../screens/SyncChecksScreen';
import { syncChecksEn } from '../../constants/strings/syncChecksEn';
import { syncEn } from '../../constants/strings/syncEn';
import type {
  RootStackParamList,
} from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

const getPracticeTimerId = () => 'local-practice-timer';

export default function AppNavigator() {
  const { palette: colors } = useAppTheme();
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
          <Root.Screen name="Sync" component={SyncScreen} options={{ headerShown: true, title: syncEn.title }} />
          <Root.Screen name="SyncChecks" component={SyncChecksScreen} options={{ headerShown: true, title: syncChecksEn.title }} />
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
            name="LanProbe"
            component={LanProbeScreen}
            getId={({ params }) => params.fingerprint}
            options={{ headerShown: true, title: lanProbeEn.title }}
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
          <Root.Screen
            name="DevicePermissions"
            component={DevicePermissionsScreen}
            getId={({ params }) => params.fingerprint}
            options={{
              headerShown: true,
              title: devicePermissionsEn.title,
            }}
          />
          <Root.Screen
            name="ReceivedSchedules"
            component={ReceivedSchedulesScreen}
            options={{
              headerShown: true,
              title: receivedSchedulesEn.title,
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
