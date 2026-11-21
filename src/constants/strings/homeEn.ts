import {
  formatCalendarDate,
  formatProgramDuration,
} from './programFormatting';

export const homeEn = {
  title: 'JW Meeting Timer',
  offline: 'Available offline',
  next: 'Next local meeting',
  local: 'Local program',
  midweek: 'Midweek',
  weekend: 'Weekend',
  parts: 'Program parts',
  duration: 'Timed duration',
  assignments: 'Duties assigned',
  assignmentsTitle: 'Assignments',
  quickActions: 'Quick actions',
  openProgram: 'Open program',
  meetings: 'Meetings',
  meetingsDescription: 'View and manage local programs',
  assignmentsDescription: 'View the four technical duties',
  received: 'Received schedules',
  receivedDescription: 'Open copies received from trusted devices',
  sync: 'Schedule synchronization',
  syncDescription: 'Review trusted-device schedule transfers',
  loading: 'Loading your next meeting…',
  empty: 'No local programs dated today or later.',
  error: 'Your meeting summary could not be loaded. Try again.',
  retry: 'Try again',
  chevron: '›',

  date: formatCalendarDate,
  time: formatProgramDuration,
} as const;
