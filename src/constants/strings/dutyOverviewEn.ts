import { formatCalendarDate } from './programFormatting';

export const dutyOverviewEn = {
  local: 'Local assignments',
  chooseMeeting: 'Meetings in this week',
  emptyWeek: 'No local assignments are available for this week.',
  error: 'Assignments could not be loaded. Try again.',
  profileError: 'Check your congregation profile in Settings, then reload.',
  selected: ' (selected)',
  date: formatCalendarDate,
} as const;
