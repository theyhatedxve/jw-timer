export const en = {
  appName: 'JW Timer',

  navigation: {
    home: 'Home',
    meetings: 'Meetings',
    assignments: 'Assignments',
    timer: 'Timer',
    settings: 'Settings',
  },

  actions: {
    openMeetings: 'Open meetings',
    openTimer: 'Open timer',
    openPracticeTimer: 'Open practice timer',
    openDiagnostics: 'Open SQLite checks',
    openProfile: 'Congregation profile',
    back: 'Back',
  },

  sections: {
    home: {
      title: 'Home',
      description: 'Meeting programs, responsibilities, and timing.',
      heading: 'Welcome to JW Timer',
      body: 'Use Meetings to view programs, Assignments to view duties, and Timer to operate your local countdown.',
    },

    meetings: {
      title: 'Meetings',
      description: 'Midweek and Weekend meeting programs.',
      heading: 'Meeting programs',
      body: 'Your saved programs will appear here. Waray-Waray is the primary meeting-content language, with English also supported.',
    },

    assignments: {
      title: 'Assignments',
      description: 'People and meeting responsibilities.',
      heading: 'Meeting duties',
      body: 'Your microphone, sound, timer, and other responsibility assignments will appear here.',
    },

    timer: {
      title: 'Timer',
      description: 'Control each part with an explicit Start.',
      heading: 'Practice timer',
      body: 'Open the existing timer to use its two practice parts. Each part waits for Start and continues into overtime until you advance.',
    },

    settings: {
      title: 'Settings',
      description: 'Language preferences and local tools.',
      heading: 'Language',
      body: 'Open Congregation profile to view or change your local name, timezone, and primary meeting-content language.',
    },
  },
} as const;

export type MainSection = keyof typeof en.sections;