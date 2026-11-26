import type {
  NavigatorScreenParams,
} from '@react-navigation/native';

import type { MeetingDraft } from '../../backend/domain/meetings/meeting.types';

export type MainTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Timer: undefined;
  SettingsTab: undefined;
};

export interface TimerProgramRequest {
  readonly meetingId: string;
  readonly requestId: string;
}

export type RootStackParamList = {
  Appearance: undefined;
  NativewindPreview: undefined;
  SetupProfile: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Settings: undefined;
  MeetingPrograms: undefined;
  EditProfile: undefined;
  PracticeTimer: TimerProgramRequest | undefined;
  Diagnostics: undefined;
  MeetingEditor: {
    meetingId?: string;
    importDraft?: MeetingDraft;
    importKey?: string;
  } | undefined;
  WorkbookImport: undefined;
  Backups: undefined;
  BackupChecks: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
