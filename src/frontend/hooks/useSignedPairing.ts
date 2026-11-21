import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';

import type {
  SignedPairingService,
} from '../../backend/services/signedPairingService';

import { signedPairingEn as text } from '../../constants/strings/signedPairingEn';

export function useSignedPairing(
  service: SignedPairingService,
  fingerprint: string,
) {
  const [snapshot, setSnapshot] = useState(() => service.snapshot());
  const [incoming, setIncoming] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mounted = useRef(false);
  const working = useRef(false);

  usePreventRemove(busy, () => {
    Alert.alert(text.title, text.wait);
  });

  useEffect(() => {
    mounted.current = true;

    const interval = setInterval(() => {
      const current = service.snapshot();

      if (
        current.phase !== 'idle' &&
        current.phase !== 'trusted' &&
        current.expiresAt <= Date.now()
      ) {
        service.cancel();
        setSnapshot(service.snapshot());
        setError(text.failed);
      }
    }, 1000);

    return () => {
      mounted.current = false;
      clearInterval(interval);
      service.cancel();
    };
  }, [service]);

  async function run(action: () => Promise<void>) {
    if (working.current) return;

    working.current = true;
    setBusy(true);
    setError('');

    try {
      await action();

      if (mounted.current) {
        setSnapshot(service.snapshot());
        setIncoming('');
      }
    } catch {
      if (mounted.current) {
        setSnapshot(service.snapshot());
        setError(text.failed);
      }
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return {
    snapshot,
    incoming,
    setIncoming,
    busy,
    error,
    start: () => run(() => service.begin(fingerprint)),
    receive: () => run(() => service.receive(incoming)),
    approve: () => {
      Alert.alert(text.title, text.compare, [
        { text: text.cancel, style: 'cancel' },
        {
          text: text.confirm,
          onPress: () => { void run(() => service.approve()); },
        },
      ]);
    },
  };
}
