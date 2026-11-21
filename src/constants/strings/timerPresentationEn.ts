export const timerPresentationEn = {
  title: 'Meeting timer',
  entryDescription:
    'Open your current timer or choose a saved meeting program.',
  operationNote:
    'Every part waits for Start. At zero, timing continues into overtime until you advance.',
  loading: 'Loading your timer…',
  current: 'Current part',
  next: 'Next part',
  progress: 'Elapsed portion of allotted time',
  showAgenda: 'Show program agenda',
  hideAgenda: 'Hide program agenda',
  menuSymbol: '⋮',
  durationMissing: '—',
  allotted: (duration: string): string => `of ${duration}`,
  savedElapsed: (milliseconds: number): string =>
    `${Math.floor(milliseconds / 1000)} seconds saved`,
} as const;
