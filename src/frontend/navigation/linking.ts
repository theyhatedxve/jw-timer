import type {
  LinkingOptions,
} from '@react-navigation/native';

import type {
  RootStackParamList,
} from './types';

export const linking:
  LinkingOptions<RootStackParamList> = {
    prefixes: ['jwtimer-prototype://'],

    config: {
      initialRouteName: 'Main',

      screens: {
        SetupProfile: 'setup/profile',

        Main: {
          screens: {
            Home: '',
            Assignments: 'assignments',
            Timer: 'timer',
            Meetings: 'programs',
            SettingsTab: 'preferences',
          },
        },

        Settings: 'settings',
        MeetingPrograms: 'meetings',
        EditProfile: 'settings/profile',
        PracticeTimer: 'timer/prototype',
        Diagnostics: 'diagnostics',
      },
    },
  };