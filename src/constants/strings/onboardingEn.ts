export const onboardingEn = {
  appName: 'JW Meeting Timer',
  skip: 'Skip intro',
  back: 'Back',
  next: 'Next',
  setup: 'Set up congregation',
  progress: 'Introduction progress',
  step: (current: number, total: number) => current + ' of ' + total,
  steps: [
    {
      icon: 'meetings',
      title: 'A program for every meeting.',
      body: 'Import this week’s program from WOL, or choose a local workbook or Watchtower PDF.',
      note: 'Your saved programs appear in Meetings.',
    },
    {
      icon: 'timer',
      title: 'Start when you’re ready.',
      body: 'Pause, resume, and switch between parts without losing their elapsed time. Open fullscreen for a larger view.',
      note: 'Nothing starts automatically.',
    },
    {
      icon: 'globe',
      title: 'Set up once. Use it offline.',
      body: 'Choose your congregation name, program language, and time zone. Change them later in Settings.',
      note: 'Saved programs stay on this device.',
    },
  ],
} as const;
