import { useEffect, useRef, useState } from 'react';

import type {
  WorkbookFile,
  WorkbookFileService,
} from '../../backend/domain/imports/workbookFile';

import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

export function useWorkbookFile(service: WorkbookFileService) {
  const [file, setFile] = useState<WorkbookFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = useRef<WorkbookFile | null>(null);
  const mounted = useRef(false);
  const selecting = useRef(false);

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
    if (selecting.current) return;

    selecting.current = true;
    setBusy(true);
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
    } catch {
      if (mounted.current) setError(text.unreadable);
    } finally {
      selecting.current = false;

      if (mounted.current) setBusy(false);
    }
  }

  return { file, busy, error, select };
}