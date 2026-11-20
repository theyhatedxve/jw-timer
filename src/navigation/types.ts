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
  PracticeTimer: undefined;
  Diagnostics: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
