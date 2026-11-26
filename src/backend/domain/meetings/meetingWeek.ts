import { isCalendarDate } from './meetingValidation';

export function meetingWeek(date: string): string {
  if (!isCalendarDate(date)) throw new Error('Invalid meeting date.');

  const value = new Date(`${date}T00:00:00.000Z`);
  const offset = (value.getUTCDay() + 6) % 7;

  value.setUTCDate(value.getUTCDate() - offset);
  return value.toISOString().slice(0, 10);
}
