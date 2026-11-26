import { currentWolWeek, type WolProgramRequest } from '../domain/imports/wolProgram';
import { meetingWeek } from '../domain/meetings/meetingWeek';
import type { MeetingDraft, MeetingResult } from '../domain/meetings/meeting.types';
import type { MeetingService } from './meetingService';

export interface WolImportReport {
  readonly monday: string;
  readonly imported: boolean;
}

function hasSavedWeek(
  meetings: MeetingService,
  request: WolProgramRequest,
  monday: string,
): MeetingResult<boolean> {
  const existing = meetings.list();
  if (!existing.ok) return existing;

  for (const summary of existing.value) {
    if (summary.meetingType !== request.meetingType || meetingWeek(summary.meetingDate) !== monday) continue;
    const saved = meetings.get(summary.id);
    if (!saved.ok) return saved;
    if (saved.value?.draft.programLanguage === request.language) return { ok: true, value: true };
  }
  return { ok: true, value: false };
}

export function createOnlineWorkbookImporter(
  meetings: MeetingService,
  load: (request: WolProgramRequest, signal: AbortSignal) => Promise<MeetingDraft | null>,
) {
  return async (
    request: WolProgramRequest,
    signal: AbortSignal,
  ): Promise<MeetingResult<WolImportReport | null>> => {
    try {
      if (signal.aborted) return { ok: true, value: null };
      const { monday } = currentWolWeek(request);
      const existing = hasSavedWeek(meetings, request, monday);
      if (!existing.ok) return existing;
      if (existing.value) return { ok: true, value: { monday, imported: false } };

      const draft = await load(request, signal);
      if (signal.aborted || !draft) return { ok: true, value: null };
      if (
        draft.meetingDate !== monday || draft.meetingType !== request.meetingType ||
        draft.programLanguage !== request.language || draft.timezone !== request.timezone
      ) {
        return { ok: false, error: { field: 'wol', message: 'The program does not match the requested week and language.' } };
      }

      // A local program may have been saved while the website request was in flight.
      const latest = hasSavedWeek(meetings, request, monday);
      if (!latest.ok) return latest;
      if (latest.value) return { ok: true, value: { monday, imported: false } };

      const result = meetings.save(draft, null);
      if (!result.ok && result.error.field !== 'importDuplicate') return result;
      return { ok: true, value: { monday, imported: result.ok } };
    } catch (error) {
      if (signal.aborted) return { ok: true, value: null };
      return {
        ok: false,
        error: { field: 'wol', message: error instanceof Error ? error.message : 'WOL import failed. Try again.' },
      };
    }
  };
}

export type OnlineWorkbookImporter = ReturnType<typeof createOnlineWorkbookImporter>;
