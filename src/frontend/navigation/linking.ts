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
        Onboarding: 'welcome',
        SetupProfile: 'setup/profile',

        Main: {
          screens: {
            Home: '',
            Timer: 'timer',
            Meetings: 'programs',
            SettingsTab: 'preferences',
          },
        },

        Settings: 'settings',
        FullscreenTimerSettings: 'settings/fullscreen-timer',
        MeetingPrograms: 'meetings',
        EditProfile: 'settings/profile',
        PracticeTimer: 'timer/prototype',
        Diagnostics: 'diagnostics',
      },
    },
  };
