import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCameraPermissions } from 'expo-camera';
import { codeExchangeEn as text } from '../../constants/strings/codeExchangeEn';

export function useCodeExchange(onChange: ((value: string) => void) | undefined, maxLength: number, disabled: boolean) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const active = useRef(false);
  const accepting = useRef(false);
  const requesting = useRef(false);
  useFocusEffect(useCallback(() => {
    active.current = true;
    setScanning(false);
    setShowQr(false);
    const stop = () => { generation.current++; accepting.current = false; setScanning(false); setShowQr(false); };
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') stop(); });
    return () => { active.current = false; generation.current++; accepting.current = false; subscription.remove(); };
  }, []));
  async function scan() {
    if (disabled || !onChange || !active.current || requesting.current) return;
    requesting.current = true;
    const token = ++generation.current;
    setError('');
    try {
      const result = permission?.granted ? permission : await requestPermission();
      if (!active.current || token !== generation.current) return;
      if (!result.granted) { setError(text.permission); return; }
      accepting.current = true;
      setScanning(true);
    } catch { if (active.current && token === generation.current) setError(text.failed); }
    finally { requesting.current = false; }
  }
  return { scanning: active.current && scanning, showQr: active.current && showQr, error, scan,
    toggleQr: () => { if (active.current) setShowQr(value => !value); },
    close: () => { generation.current++; accepting.current = false; if (active.current) setScanning(false); },
    cameraFailed: () => { accepting.current = false; if (active.current) { setScanning(false); setError(text.failed); } },
    receive: (data: string) => {
      if (!active.current || !accepting.current || disabled || !onChange) return;
      accepting.current = false;
      setScanning(false);
      if (!data || data.length > maxLength) { setError(text.invalid); return; }
      setError('');
      onChange(data);
    },
  };
}
