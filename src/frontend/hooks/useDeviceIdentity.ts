import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';

import type {
  DeviceIdentity,
} from '../../backend/domain/devices/deviceIdentity';

import type {
  DeviceIdentityService,
} from '../../backend/services/deviceIdentityService';

import { deviceIdentityEn as text } from '../../constants/strings/deviceIdentityEn';

export function useDeviceIdentity(service: DeviceIdentityService) {
  const [identity, setIdentity] = useState<DeviceIdentity | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');

  const mounted = useRef(false);
  const working = useRef(false);

  usePreventRemove(busy, () => {
    Alert.alert(text.title, text.wait);
  });

  async function execute(action: 'read' | 'create' | 'check') {
    if (working.current) return;

    working.current = true;
    setBusy(true);
    setError('');
    setVerified(false);

    try {
      if (action === 'check') {
        const result = await service.check();

        if (!mounted.current) return;

        setVerified(result.ok);
        if (!result.ok) setError(text.errors[result.code]);
        return;
      }

      const result = await service[action]();

      if (!mounted.current) return;

      if (result.ok) {
        setIdentity(result.value);
        setLoaded(true);
      } else {
        setIdentity(null);
        setLoaded(false);
        setError(text.errors[result.code]);
      }
    } catch {
      if (mounted.current) setError(text.errors.keystore);
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    void execute('read');

    return () => { mounted.current = false; };
  }, [service]);

  return {
    identity,
    loaded,
    busy,
    verified,
    error,
    refresh: () => execute('read'),
    create: () => execute('create'),
    check: () => execute('check'),
  };
}