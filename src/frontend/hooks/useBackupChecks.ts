import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';

import type {
  DiagnosticResult,
  RunBackupChecks,
} from '../../backend/services/diagnostics.types';

import { backupChecksEn } from '../../constants/strings/backupChecksEn';

export function useBackupChecks(runChecks: RunBackupChecks, text: { readonly title: string; readonly wait: string; readonly failed: string } = backupChecksEn) {
  const [results, setResults] =
    useState<readonly DiagnosticResult[] | null>(null);
  const [busy, setBusy] = useState(false);

  const mounted = useRef(false);
  const running = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  usePreventRemove(busy, () => {
    Alert.alert(text.title, text.wait);
  });

  async function run() {
    if (running.current) return;

    running.current = true;
    setBusy(true);
    setResults(null);

    try {
      const next = await runChecks();
      if (mounted.current) setResults(next);
    } catch {
      if (mounted.current) {
        setResults([{
          name: text.title,
          passed: false,
          detail: text.failed,
        }]);
      }
    } finally {
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return { results, busy, run };
}
