import { Temporal } from '@js-temporal/polyfill';

export function formatCalendarDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00Z`));
}

export function formatProgramDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;

  return [
    hours > 0 ? `${hours} h` : '',
    minutes > 0 ? `${minutes} min` : '',
    remaining > 0 ? `${remaining} s` : '',
  ].filter(Boolean).join(' ') || '0 min';
}

export function formatMeetingWeek(start: string): string {
  const end = Temporal.PlainDate.from(start).add({ days: 6 }).toString();

  return `${formatCalendarDate(start)} – ${formatCalendarDate(end)}`;
}

export function formatCompactMeetingWeek(start: string): string {
  const first = Temporal.PlainDate.from(start);
  const last = first.add({ days: 6 });

  if (first.year !== last.year) return formatMeetingWeek(start);

  const monthDay = (date: Temporal.PlainDate) =>
    date.toLocaleString('en-US', { month: 'short', day: 'numeric' });

  const end = first.month === last.month ? last.day : monthDay(last);
  return `${monthDay(first)} – ${end}`;
}
