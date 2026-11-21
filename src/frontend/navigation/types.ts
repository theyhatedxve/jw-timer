import type {
  NavigatorScreenParams,
} from '@react-navigation/native';

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
  MeetingPrograms: undefined;
  EditProfile: undefined;
  PracticeTimer: TimerProgramRequest | undefined;
  Diagnostics: undefined;
  MeetingEditor: { meetingId?: string } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}