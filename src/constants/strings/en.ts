export const en = {
  appName: 'JW Timer',

  navigation: {
    home: 'Home',
    meetings: 'Meeting programs',
    timer: 'Timer',
    settings: 'Settings',
  },

  actions: {
    openMeetings: 'Manage programs',
    managePrograms: 'Manage programs',
    openTimer: 'Open timer',
    openPracticeTimer: 'Open current timer',
    openSettings: 'Open settings',
    openDiagnostics: 'Open SQLite checks',
    openProfile: 'Congregation profile',
    back: 'Back',
  },

  sections: {
    home: {
      title: 'Home',
      description: 'Your meeting programs and local timer.',
      heading: 'Welcome to JW Timer',
      body:
        'Import and review meeting programs, then use the local timer.',
    },

    meetings: {
      title: 'Meeting programs',
      description: 'Saved Midweek and Weekend programs.',
      heading: 'Meeting programs',
      body:
        'Create and edit programs locally. English and ' +
        'Waray-Waray content are supported.',
    },


    timer: {
      title: 'Timer',
      description: 'Meeting programs and manual timing.',
      heading: 'Meeting timer',
      body:
        'Manage your saved programs or reopen the current timer. ' +
        'Every part requires Start and continues into overtime ' +
        'until you advance.',
    },

    settings: {
      title: 'Settings',
      description: 'Profile preferences and local tools.',
      heading: 'Congregation profile',
      body:
        'View or change your congregation name, time zone ' +
        'and program-language preference.',
    },
  },
} as const;

export type MainSection = keyof typeof en.sections;
