import { useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

import {
  estimatedProgramFinishMs,
} from '../../backend/domain/timer/timerAgenda';

import {
  timerEn,
} from '../../constants/strings/timerEn';

import {
  timerLayout,
} from '../../constants/timerTheme';

import { useLocalProfile } from './useLocalProfile';

import type { useTimerSession } from './useTimerSession';

export interface TimerAgendaRow {
  readonly id: string;
  readonly index: number;
  readonly title: string;
  readonly sectionTitle: string;
  readonly sectionIndex: number;
  readonly startsSection: boolean;
  readonly durationLabel: string;
  readonly timerLabel: string;
  readonly current: boolean;
}

type SessionModel = ReturnType<typeof useTimerSession>;

function formatDuration(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000);

  return [
    String(Math.floor(seconds / 60)).padStart(2, '0'),
    String(seconds % 60).padStart(2, '0'),
  ].join(':');
}

function formatWeek(value: string | undefined): string {
  if (!value) return timerEn.dateMissing;

  // A calendar date is kept independent of the device time zone.
  const date = new Date(`${value}T00:00:00.000Z`);
  const offset = (date.getUTCDay() + 6) % 7;

  const start = new Date(date);
  start.setUTCDate(start.getUTCDate() - offset);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return `Week ${formatter.format(start)} – ${
    formatter.format(end)
  }`;
}

export function useTimerAgenda(model: SessionModel) {
  const { width, fontScale } = useWindowDimensions();
  const { state } = useLocalProfile();

  const profileTimezone =
    state.status === 'ready'
      ? state.profile?.timezone
      : undefined;

  const timezone =
    model.program.timezone ?? profileTimezone ?? 'UTC';

  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }),
    [timezone],
  );

  const finishFormatter = useMemo(
    () => new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }),
    [timezone],
  );

  const rows = useMemo<readonly TimerAgendaRow[]>(
    () => model.program.parts.map((part, index, parts) => {
      const sectionIndex = part.sectionIndex ?? 0;
      const previous = parts[index - 1];
      const current = index === model.timer.partIndex;

      return {
        id: part.id,
        index,
        title: part.title,
        sectionTitle: part.sectionTitle ?? timerEn.agenda,
        sectionIndex,
        startsSection:
          index === 0 ||
          sectionIndex !== (previous?.sectionIndex ?? 0) ||
          part.sectionTitle !== previous?.sectionTitle,
        durationLabel: formatDuration(part.durationMs),
        timerLabel: current
          ? model.timer.status === 'completed'
            ? timerEn.finished
            : model.digits
          : index < model.timer.partIndex
            ? '—'
            : formatDuration(part.durationMs),
        current,
      };
    }),
    [
      model.program,
      model.timer.partIndex,
      model.timer.status,
      model.digits,
    ],
  );

  // Keep wall time and the timer's monotonic clock aligned between ticks.
  const [wallOffsetMs] = useState(() => Date.now() - performance.now());
  const finish = useRef<{
    readonly program: SessionModel['program'];
    readonly timestampMs: number;
  } | null>(null);
  const previousFinishMs = finish.current?.program === model.program
    ? finish.current.timestampMs
    : undefined;
  const finishMs = model.ready && !model.pendingRecovery && !model.locked
    ? estimatedProgramFinishMs(
      model.program,
      model.timer,
      model.nowMs,
      wallOffsetMs + model.nowMs,
      previousFinishMs,
    )
    : previousFinishMs;

  // Cache for completion/recovery without scheduling a second render per tick.
  useEffect(() => {
    if (finishMs !== undefined) {
      finish.current = { program: model.program, timestampMs: finishMs };
    }
  }, [model.program, finishMs]);

  const wallNow = Date.now();
  const estimatedFinish = finishMs !== undefined
    ? finishFormatter.format(new Date(finishMs))
    : '—';

  return {
    rows,
    timezone,
    clock: timeFormatter.format(new Date(wallNow)),
    week: model.program.meetingId
      ? formatWeek(model.program.meetingDate)
      : timerEn.practice,
    compact:
      width < timerLayout.tableBreakpoint ||
      fontScale > 1.3,
    estimatedFinish,
    estimateNote: timerEn.estimateNote,
  };
}