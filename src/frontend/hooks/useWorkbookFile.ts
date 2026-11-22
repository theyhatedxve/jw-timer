import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  WorkbookFile,
  WorkbookFileService,
} from '../../backend/domain/imports/workbookFile';

import type {
  WorkbookTextService,
} from '../../backend/domain/imports/workbookText';

import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLocalProfile } from './useLocalProfile';
import { useWatchtowerImport } from './useWatchtowerImport';

import { buildWorkbookCandidates } from '../../backend/domain/imports/workbookParser';
import { workbookParsingEn as parsingText } from '../../constants/strings/workbookParsingEn';

import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

export function useWorkbookFile(
  service: WorkbookFileService,
  extractor: WorkbookTextService,
) {

  const [file, setFile] = useState<WorkbookFile | null>(null);
  const [pages, setPages] = useState<readonly string[]>([]);
  const [busy, setBusy] =
    useState<'selecting' | 'extracting' | null>(null);
  const [error, setError] = useState('');

  const watchtower = useWatchtowerImport(
    pages,
    file,
    busy !== null,
  );

  const navigation = useNavigation();
  const { state: profileState } = useLocalProfile();
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const timezone = profileState.status === 'ready'
    ? profileState.profile?.timezone ?? 'UTC'
    : 'UTC';

  const candidates = useMemo(
    () => buildWorkbookCandidates(
      pages,
      year,
      timezone,
      file?.name ?? '',
    ),
    [pages, year, timezone, file?.name],
  );

  const current = useRef<WorkbookFile | null>(null);
  const mounted = useRef(false);
  const working = useRef(false);

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
    if (working.current) return;

    working.current = true;
    setBusy('selecting');
    setError('');

    try {
      const result = await service.select();

      if (!mounted.current) {
        if (result.ok && result.file) {
          service.release(result.file);
        }
        return;
      }

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (!result.file) return;

      if (current.current) service.release(current.current);

      current.current = result.file;
      setFile(result.file);

      const filenameYear =
        /_(\d{4})\d{2}\.pdf$/i.exec(result.file.name)?.[1];

      setYear(filenameYear ?? String(new Date().getFullYear()));
      setPages([]);
    } catch {
      if (mounted.current) setError(text.unreadable);
    } finally {
      working.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  async function extract() {
    const selected = current.current;

    if (!selected || working.current) return;

    working.current = true;
    setBusy('extracting');
    setError('');
    setPages([]);

    try {
      const result = await extractor.extract(selected);

      if (
        !mounted.current ||
        current.current?.uri !== selected.uri
      ) {
        return;
      }

      if (result.ok) {
        setPages(result.pages);
      } else {
        setError(result.message);
      }
    } catch {
      if (mounted.current) setError(text.unreadable);
    } finally {
      working.current = false;
      if (mounted.current) setBusy(null);
    }
  }

  function openCandidate(key: string) {
    if (working.current || !file) return;

    const candidate = candidates.find(item => item.key === key);
    if (!candidate) return;

    Alert.alert(
      parsingText.confirmTitle,
      candidate.warnings.join('\n\n'),
      [
        { text: parsingText.cancel, style: 'cancel' },
        {
          text: parsingText.continue,
          onPress: () => navigation.navigate('MeetingEditor', {
            importDraft: candidate.draft,
            importKey: `${file.uri}:${candidate.key}`,
          }),
        },
      ],
    );
  }


  return {
    file,
    pages,
    busy,
    error,
    watchtower,
    select: () => watchtower.confirmDiscard(() => {
      void select();
    }),
    extract: () => watchtower.confirmDiscard(() => {
      void extract();
    }),
    year,
    setYear,
    candidates,
    openCandidate,
  };
}
