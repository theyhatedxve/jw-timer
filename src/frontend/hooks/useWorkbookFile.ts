import { useEffect, useRef, useState } from 'react';

import type {
  WorkbookFile,
  WorkbookFileService,
} from '../../backend/domain/imports/workbookFile';

import type {
  WorkbookTextService,
} from '../../backend/domain/imports/workbookText';

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

  return { file, pages, busy, error, select, extract };
}