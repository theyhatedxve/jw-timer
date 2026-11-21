import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Assignments: undefined;
  Timer: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  SetupProfile: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  EditProfile: undefined;
  PracticeTimer: TimerProgramRequest | undefined;
  Diagnostics: undefined;
  MeetingEditor: { meetingId?: string } | undefined;
};

export interface TimerProgramRequest {
  readonly meetingId: string;
  readonly requestId: string;
}

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
