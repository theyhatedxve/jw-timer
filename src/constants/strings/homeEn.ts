import {
  formatMeetingWeek,
  formatProgramDuration,
} from './programFormatting';

export const homeEn = {
  title: 'JW Meeting Timer',
  offline: 'Available offline',
  nextMidweek: 'Next Midweek meeting',
  nextWeekend: 'Next Weekend meeting',
  play: '▶',
  parts: 'Program parts',
  duration: 'Timed duration',
  quickActions: 'Quick actions',
  openProgram: 'Open program',
  meetings: 'Meetings',
  meetingsDescription: 'View and manage local programs',
  loading: 'Loading your next meeting…',
  empty: 'No local programs dated today or later.',
  error: 'Your meeting summary could not be loaded. Try again.',
  retry: 'Try again',
  chevron: '›',

  week: formatMeetingWeek,
  time: formatProgramDuration,
} as const;
