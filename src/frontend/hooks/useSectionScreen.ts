import { appearanceEn } from '../../constants/strings/appearanceEn';
import { nativewindPreviewEn } from '../../constants/strings/nativewindPreviewEn';
import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import { meetingDutyEn } from '../../constants/strings/meetingDutyEn';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';
import { workbookImportEn } from '../../constants/strings/workbookImportEn';
import {
  en,
  type MainSection,
} from '../../constants/strings/en';

import { deviceIdentityEn } from '../../constants/strings/deviceIdentityEn';
import { receivedSchedulesEn } from '../../constants/strings/receivedSchedulesEn';
import { backupChecksEn } from '../../constants/strings/backupChecksEn';
import { deviceRequestsEn } from '../../constants/strings/deviceRequestsEn';

import { backupEn } from '../../constants/strings/backupEn';
import { syncEn } from '../../constants/strings/syncEn';
import { syncChecksEn } from '../../constants/strings/syncChecksEn';

interface SectionAction {
  readonly id: string;
  readonly label: string;
  readonly onPress: () => void;
}

export function useSectionScreen(section: MainSection) {
  const navigation = useNavigation();
  const content = en.sections[section];

  useFocusEffect(
    useCallback(() => {
      AccessibilityInfo.announceForAccessibility(
        content.title,
      );
    }, [content.title]),
  );

  const actions: Record<
    MainSection,
    readonly SectionAction[]
  > = {
    home: [
      { id: 'sync', label: syncEn.title, onPress: () => navigation.navigate('Sync') },
      {
        id: 'timer',
        label: en.actions.openTimer,
        onPress: () => navigation.navigate(
          'Main',
          { screen: 'Timer' },
        ),
      },
      {
        id: 'assignments',
        label: en.actions.openAssignments,
        onPress: () => navigation.navigate(
          'Main',
          { screen: 'Assignments' },
        ),
      },
      {
        id: 'received-schedules',
        label: receivedSchedulesEn.open,
        onPress: () =>
          navigation.navigate('ReceivedSchedules'),
      },
    ],

    meetings: [],
    assignments: [],

    timer: [
      {
        id: 'programs',
        label: en.actions.managePrograms,
        onPress: () =>
          navigation.navigate('MeetingPrograms'),
      },
      {
        id: 'current-timer',
        label: en.actions.openPracticeTimer,
        onPress: () =>
          navigation.navigate('PracticeTimer'),
      },
    ],

    settings: [
      {
        id: 'appearance',
        label: appearanceEn.title,
        onPress: () => navigation.navigate('Appearance'),
      },
      ...(__DEV__ ? [{
        id: 'nativewind-preview',
        label: nativewindPreviewEn.title,
        onPress: () => navigation.navigate('NativewindPreview'),
      }] : []),
      { id: 'sync-checks', label: syncChecksEn.title, onPress: () => navigation.navigate('SyncChecks') },
      { id: 'sync', label: syncEn.title, onPress: () => navigation.navigate('Sync') },
      {
        id: 'manage-assignments',
        label: meetingDutyEn.title,
        onPress: () => navigation.navigate('ManageAssignments'),
      },
      {
        id: 'profile',
        label: en.actions.openProfile,
        onPress: () =>
          navigation.navigate('EditProfile'),
      },
      {
        id: 'diagnostics',
        label: en.actions.openDiagnostics,
        onPress: () =>
          navigation.navigate('Diagnostics'),
      },
      {
        id: 'workbook-import',
        label: workbookImportEn.title,
        onPress: () => navigation.navigate('WorkbookImport'),
      },
      {
        id: 'backups',
        label: backupEn.title,
        onPress: () => navigation.navigate('Backups'),
      },
      {
        id: 'backup-checks',
        label: backupChecksEn.title,
        onPress: () => navigation.navigate('BackupChecks'),
      },
      {
        id: 'device-identity',
        label: deviceIdentityEn.title,
        onPress: () => navigation.navigate('DeviceIdentity'),
      },
      {
        id: 'device-requests',
        label: deviceRequestsEn.title,
        onPress: () => navigation.navigate('DeviceRequests'),
      },
    ],
  };

  return {
    content,
    actions: actions[section],
  };
}
