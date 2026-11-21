import { useCallback, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect, usePreventRemove } from '@react-navigation/native';
import type { LanProbeService } from '../../backend/services/lanProbeService';
import { lanProbeEn as text } from '../../constants/strings/lanProbeEn';
import type { SharedSchedule } from '../../backend/domain/devices/sharedSchedule';

export function useLanProbe(service: LanProbeService, fingerprint: string) {
  const [code, setCode] = useState('');
  const [incoming, setIncoming] = useState('');
  const [hosting, setHosting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<SharedSchedule | null>(null);
  const [canSave, setCanSave] = useState(false);
  const active = useRef(false);
  const generation = useRef(0);
  const working = useRef<number | null>(null);

  const clearPreview = useCallback(() => { setPreview(null); setCanSave(false); }, []);
  usePreventRemove(busy, () => Alert.alert(text.title, text.wait));
  useFocusEffect(useCallback(() => {
    active.current = true;
    generation.current++;
    const invalidate = () => {
      active.current = false;
      generation.current++;
      working.current = null;
      clearPreview(); setHosting(false); setBusy(false);
      void service.stop().catch(() => undefined);
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') invalidate();
      else { active.current = true; generation.current++; }
    });
    return () => { invalidate(); subscription.remove(); };
  }, [clearPreview, service]));

  async function run(action: (current: () => boolean) => Promise<void>) {
    if (!active.current || working.current !== null) return;
    const id = ++generation.current;
    working.current = id;
    const current = () => active.current && generation.current === id;
    setBusy(true); setMessage('');
    try { await action(current); }
    catch {
      if (current()) {
        await service.stop().catch(() => undefined);
        if (current()) { clearPreview(); setHosting(false); setMessage(text.failed); }
      }
    } finally {
      if (working.current === id) {
        working.current = null;
        if (active.current) setBusy(false);
      }
    }
  }
  return {
    fingerprint, code, incoming, setIncoming, hosting, busy, message,
    preview: active.current ? preview : null,
    canSave: active.current && canSave,
    download: () => run(async current => {
      clearPreview();
      const received = await service.download(fingerprint, incoming);
      if (current()) { setPreview(received); setCanSave(received !== null); setMessage(received ? text.previewReady : text.denied); }
    }),
    loadReceived: () => run(async current => {
      clearPreview();
      const received = await service.loadReceived(fingerprint);
      if (current()) { setPreview(received); setMessage(received ? text.savedCopy : text.noSavedCopy); }
    }),
    saveReceived: () => {
      if (working.current !== null || !active.current || !canSave) return;
      const expected = generation.current;
      Alert.alert(text.saveReceived, text.saveQuestion, [
        { text: text.cancel, style: 'cancel' },
        { text: text.saveReceived, onPress: () => {
          if (!active.current || generation.current !== expected) return;
          void run(async current => {
            await service.saveReceived(fingerprint);
            if (current()) { setCanSave(false); setMessage(text.saved); }
          });
        } },
      ]);
    },
    prepare: () => run(async current => {
      const value = await service.describe(fingerprint);
      if (current()) setCode(value);
    }),
    start: () => run(async current => {
      clearPreview();
      const value = await service.start(fingerprint, () => {
        if (current()) { setHosting(false); setMessage(text.stopped); }
      });
      if (current()) { setCode(value); setHosting(true); }
    }),
    stop: () => run(async current => {
      clearPreview();
      await service.stop();
      if (current()) { setHosting(false); setMessage(text.stopped); }
    }),
    connect: () => run(async current => {
      const accepted = await service.probe(fingerprint, incoming);
      if (current()) setMessage(accepted ? text.accepted : text.denied);
    }),
    checkProtocol: () => run(async current => {
      if (!await service.checkProtocol()) throw new Error('Protocol check failed');
      if (current()) setMessage(text.protocolPassed);
    }),
  };
}
