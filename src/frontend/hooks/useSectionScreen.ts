import { useCallback } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { appearanceEn } from '../../constants/strings/appearanceEn';
import { settingsEn } from '../../constants/strings/settingsEn';
import { nativewindPreviewEn } from '../../constants/strings/nativewindPreviewEn';
import { workbookImportEn } from '../../constants/strings/workbookImportEn';
import { backupEn } from '../../constants/strings/backupEn';
import { backupChecksEn } from '../../constants/strings/backupChecksEn';
import {
  en,
  type MainSection,
} from '../../constants/strings/en';

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
      AccessibilityInfo.announceForAccessibility(content.title);
    }, [content.title]),
  );

  const actions: Record<MainSection, readonly SectionAction[]> = {
    home: [
      {
        id: 'timer',
        label: en.actions.openTimer,
        onPress: () => navigation.navigate(
          'Main',
          { screen: 'Timer' },
        ),
      },
    ],

    meetings: [],

    timer: [],

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
      {
        id: 'profile',
        label: en.actions.openProfile,
        onPress: () => navigation.navigate('EditProfile'),
      },
      {
        id: 'diagnostics',
        label: en.actions.openDiagnostics,
        onPress: () => navigation.navigate('Diagnostics'),
      },
      {
        id: 'workbook-import',
        label: workbookImportEn.title,
        onPress: () => navigation.navigate('WorkbookImport'),
      },
      {
        id: 'timer-display',
        label: settingsEn.timerDisplay,
        onPress: () => navigation.navigate('Main', { screen: 'Timer' }),
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
    ],
  };

  return {
    content,
    actions: actions[section],
  };
}
