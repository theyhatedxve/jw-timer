import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { WolProgramRequest } from '../../backend/domain/imports/wolProgram';
import type { OnlineWorkbookImporter } from '../../backend/services/onlineWorkbookImport';
import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

export function useOnlineWorkbookImport(
  importer: OnlineWorkbookImporter,
  request: WolProgramRequest | null,
  showWeek: (date: string) => void,
) {
  const active = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => () => {
    active.current?.abort();
    active.current = null;
    setBusy(false);
  }, []));

  async function run() {
    if (active.current || !request) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const result = await importer(request, controller.signal);
      if (controller.signal.aborted) return;
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      if (!result.value) return;
      setMessage(result.value.imported ? text.wolImported : text.wolAlreadySaved);
      showWeek(result.value.monday);
    } catch {
      if (!controller.signal.aborted) setError(text.wolFailed);
    } finally {
      if (active.current === controller) {
        active.current = null;
        setBusy(false);
      }
    }
  }

  return {
    busy, message, error,
    ready: request !== null,
    run: () => { void run(); },
    cancel: () => active.current?.abort(),
  };
}
