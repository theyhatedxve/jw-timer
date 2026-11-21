import type {
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { PublisherRole } from '../../backend/domain/publishers/publisher';
import type { MeetingDraft } from '../../backend/domain/meetings/meeting.types';

export type MainTabParamList = {
  Home: undefined;
  Assignments: undefined;
  Timer: undefined;
};

export interface TimerProgramRequest {
  readonly meetingId: string;
  readonly requestId: string;
}

export type RootStackParamList = {
  SetupProfile: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Settings: undefined;
  ManageAssignments: undefined;
  Publishers: undefined;
  MeetingPrograms: undefined;
  EditProfile: undefined;
  PracticeTimer: TimerProgramRequest | undefined;
  Diagnostics: undefined;
  MeetingEditor: {
    meetingId?: string;
    importDraft?: MeetingDraft;
    importKey?: string;
  } | undefined;
  MeetingDuties: { meetingId: string };
  WorkbookImport: undefined;
  PublisherEditor: { publisherId?: string } | undefined;
  AssignmentEditor: {
    meetingId: string;
    partId: string;
    role?: PublisherRole;
  };

  Backups: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
