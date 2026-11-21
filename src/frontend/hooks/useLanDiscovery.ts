import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { lanDiscoveryNative } from '../../backend/network/lanDiscoveryNative';
import { parseLanConnection } from '../../backend/domain/devices/lanConnection';
import { codeExchangeEn as text } from '../../constants/strings/codeExchangeEn';

export function useLanDiscovery(fingerprint?: string) {
  const [codes, setCodes] = useState<readonly string[]>([]);
  const [finding, setFinding] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const generation = useRef(0);
  const subscription = useRef<{ remove(): void } | null>(null);
  const stateSubscription = useRef<{ remove(): void } | null>(null);
  const running = useRef(false);
  const stop = useCallback(() => {
    generation.current++;
    running.current = false;
    subscription.current?.remove(); subscription.current = null;
    stateSubscription.current?.remove(); stateSubscription.current = null;
    if (active.current) setFinding(false);
    void lanDiscoveryNative.stop().catch(() => undefined);
  }, []);
  useFocusEffect(useCallback(() => {
    active.current = true;
    setFinding(false); setCodes([]);
    const lifecycle = AppState.addEventListener('change', state => {
      if (state !== 'active') { stop(); active.current = false; }
      else active.current = true;
    });
    return () => { active.current = false; lifecycle.remove(); stop(); };
  }, [stop, fingerprint]));
  async function start() {
    if (!active.current || running.current) return;
    stop();
    const token = generation.current;
    running.current = true; setFinding(true); setError(''); setCodes([]);
    let nativeGeneration: number | null = null;
    const pendingStates: { generation: number; state: 'stopped' | 'failed'; reason: string }[] = [];
    const finish = (event: { generation: number; state: 'stopped' | 'failed'; reason: string }) => {
      if (!active.current || token !== generation.current || event.generation !== nativeGeneration) return;
      generation.current++;
      running.current = false;
      subscription.current?.remove(); subscription.current = null;
      stateSubscription.current?.remove(); stateSubscription.current = null;
      setFinding(false);
      if (event.state === 'failed') setError(event.reason === 'restartRequired' ? text.discoveryRestart : text.discoveryFailed);
    };
    try {
      stateSubscription.current = lanDiscoveryNative.onState(event => {
        if (nativeGeneration === null) { if (pendingStates.length < 32) pendingStates.push(event); }
        else finish(event);
      });
      subscription.current = lanDiscoveryNative.onFound(code => {
        if (!active.current || !running.current || token !== generation.current) return;
        try {
          const parsed = parseLanConnection(code);
          if (fingerprint && parsed.fingerprint !== fingerprint) return;
          setCodes(previous => previous.includes(code) ? previous : [...previous.slice(-19), code]);
        } catch { /* Announcements are untrusted and invalid endpoints are ignored. */ }
      });
      nativeGeneration = await lanDiscoveryNative.start();
      pendingStates.forEach(finish);
    } catch {
      if (active.current && token === generation.current) { stop(); setError(text.discoveryFailed); }
    }
  }
  return { codes, finding, error, start, stop };
}
