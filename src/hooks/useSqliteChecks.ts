import { useEffect, useRef, useState } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { DiagnosticResult, RunSqliteChecks } from '../state/diagnostics/diagnostics.types';

export function useSqliteChecks(runChecks: RunSqliteChecks) {
  const navigation = useNavigation();
  const [results, setResults] = useState<readonly DiagnosticResult[] | null>(null);
  const [busy, setBusy] = useState(false);
  const queued = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  useEffect(() => () => { if (queued.current !== null) clearTimeout(queued.current); }, []);

  function run() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setResults(null);
    queued.current = setTimeout(() => {
      try { setResults(runChecks()); }
      catch (error) { setResults([{ name: 'Unexpected diagnostic failure', passed: false, detail: String(error) }]); }
      finally { running.current = false; setBusy(false); queued.current = null; }
    }, 100);
  }
  return {
    results, busy, run,
    onBack: () => {
      if (navigation.canGoBack()) navigation.goBack();
      else navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Settings' } }] }));
    },
  };
}
