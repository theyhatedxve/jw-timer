import { useCallback, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import type { LanProbeService } from '../../backend/services/lanProbeService';
import { lanProbeEn as text } from '../../constants/strings/lanProbeEn';

export function useLanProbe(service: LanProbeService, fingerprint: string) {
  const [code, setCode] = useState('');
  const [incoming, setIncoming] = useState('');
  const [hosting, setHosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const mounted = useRef(false);
  const working = useRef(false);

  usePreventRemove(busy, () => Alert.alert(text.title, text.wait));

  useFocusEffect(useCallback(() => {
    mounted.current = true;
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') return;
      void service.stop().catch(() => undefined);
      if (mounted.current) setHosting(false);
    });
    return () => {
      mounted.current = false;
      setHosting(false);
      subscription.remove();
      void service.stop().catch(() => undefined);
    };
  }, [service]));

  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setMessage('');
    try {
      await action();
    } catch {
      await service.stop().catch(() => undefined);
      if (mounted.current) {
        setHosting(false);
        setMessage(text.failed);
      }
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return {
    code, incoming, setIncoming, hosting, busy, message,
    prepare: () => run(async () => {
      const value = await service.describe(fingerprint);
      if (mounted.current) setCode(value);
    }),
    start: () => run(async () => {
      const value = await service.start(fingerprint, () => {
        if (mounted.current) {
          setHosting(false);
          setMessage(text.stopped);
        }
      });
      if (mounted.current) {
        setCode(value);
        setHosting(true);
      }
    }),
    stop: () => run(async () => {
      await service.stop();
      if (mounted.current) {
        setHosting(false);
        setMessage(text.stopped);
      }
    }),
    connect: () => run(async () => {
      const accepted = await service.probe(fingerprint, incoming);
      if (mounted.current) setMessage(accepted ? text.accepted : text.denied);
    }),
    checkProtocol: () => run(async () => {
      if (!await service.checkProtocol()) throw new Error('Protocol check failed');
      if (mounted.current) setMessage(text.protocolPassed);
    }),
  };
}
