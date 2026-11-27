import {
  formatMeetingWeek,
  formatProgramDuration,
} from './programFormatting';

export const homeEn = {
  title: 'JW Meeting Timer',
  welcome: 'Welcome back',
  overview: 'Meeting overview',
  settings: 'Settings',
  offline: 'Offline ready',
  storedLocally: 'All programs stored locally',
  upNext: 'UP NEXT',
  midweek: 'Midweek meeting',
  weekend: 'Weekend meeting',
  tools: 'Your meeting tools',
  recentSession: 'Recent session',
  noRecentSession: 'No recent session yet.',
  partsCount: (count: number) => count + (count === 1 ? ' part' : ' parts'),
  sessionState: (status: 'ready' | 'running' | 'paused' | 'completed', digits: string) =>
    status === 'completed' ? 'Completed' :
      (status === 'paused' ? 'Paused at ' : status === 'ready' ? 'Ready at ' : 'Saved at ') + digits,
  nextMidweek: 'Next Midweek meeting',
  nextWeekend: 'Next Weekend meeting',
  play: '▶',
  parts: 'Program parts',
  duration: 'Timed duration',
  quickActions: 'Quick access',
  openProgram: 'Open meeting program',
  meetings: 'Meetings',
  timer: 'Timer',
  timerDescription: 'Control session',
  meetingsDescription: 'View program',
  loading: 'Loading your next meeting…',
  empty: 'No current-week or upcoming programs are saved.',
  error: 'Your meeting summary could not be loaded. Try again.',
  retry: 'Try again',
  chevron: '›',

  week: formatMeetingWeek,
  time: formatProgramDuration,
} as const;
