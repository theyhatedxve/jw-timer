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

import { backupEn } from '../../constants/strings/backupEn';

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
    ],
  };

  return {
    content,
    actions: actions[section],
  };
}
