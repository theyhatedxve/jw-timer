import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import type { WorkbookFile, WorkbookFileService } from '../../backend/domain/imports/workbookFile';
import type { WorkbookTextService } from '../../backend/domain/imports/workbookText';
import type { MeetingService } from '../../backend/services/meetingService';
import { importPdfPrograms, type PdfImportReport } from '../../backend/services/pdfWorkbookImport';
import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';
import { useLocalProfile } from './useLocalProfile';

export function useWorkbookFile(
  service: WorkbookFileService,
  extractor: WorkbookTextService,
  meetings: MeetingService,
) {
  const navigation = useNavigation();
  const { state } = useLocalProfile();
  const timezone = state.status === 'ready' ? state.profile?.timezone : undefined;
  const [file, setFile] = useState<WorkbookFile | null>(null);
  const [busy, setBusy] = useState<'selecting' | 'extracting' | null>(null);
  const [error, setError] = useState('');
  const [report, setReport] = useState<PdfImportReport | null>(null);
  const current = useRef<WorkbookFile | null>(null);
  const mounted = useRef(false);
  const focused = useRef(false);
  const working = useRef(false);
  const generation = useRef(0);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      generation.current += 1;
    };
  }, []));

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (current.current) {
        service.release(current.current);
        current.current = null;
      }
    };
  }, [service]);

  async function select() {
    if (working.current || !timezone || !focused.current) return;
    const requestGeneration = generation.current;
    working.current = true;
    setBusy('selecting');
    setError('');
    setReport(null);

    try {
      const selected = await service.select();
      if (!mounted.current || !focused.current || generation.current !== requestGeneration) {
        if (selected.ok && selected.file) service.release(selected.file);
        return;
      }
      if (!selected.ok) {
        setError(selected.message);
        return;
      }
      if (!selected.file) return;
      if (current.current) service.release(current.current);
      current.current = selected.file;
      setFile(selected.file);
      setBusy('extracting');

      const extracted = await extractor.extract(selected.file);
      if (
        !mounted.current || !focused.current || generation.current !== requestGeneration ||
        current.current?.uri !== selected.file.uri
      ) return;
      if (!extracted.ok) {
        setError(extracted.message);
        return;
      }
      setReport(importPdfPrograms(meetings, extracted.pages, selected.file.name, timezone));
    } catch {
      if (mounted.current && focused.current && generation.current === requestGeneration) setError(text.unreadable);
    } finally {
      working.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  return {
    file, busy, error, report,
    ready: timezone !== undefined,
    select: () => { void select(); },
    openMeetings: () => {
      if (!report?.meetingId || working.current) return;
      navigation.navigate('Main', {
        screen: 'Meetings',
        params: { meetingId: report.meetingId, requestId: String(Date.now()) },
      });
    },
  };
}
