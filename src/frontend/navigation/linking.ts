import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['jwtimer-prototype://'],
  config: {
    // Give cold detail links a parent instead of a singleton detail stack.
    initialRouteName: 'Main',
    screens: {
      SetupProfile: 'setup/profile',
      Main: { screens: {
        Home: '', Meetings: 'meetings', Assignments: 'assignments', Timer: 'timer', Settings: 'settings',
      } },
      EditProfile: 'settings/profile',
      PracticeTimer: 'timer/prototype',
      Diagnostics: 'diagnostics',
    },
  },
};
