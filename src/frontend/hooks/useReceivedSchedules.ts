import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import type {
  ReceivedScheduleReader,
  ReceivedScheduleSource,
} from '../../backend/services/receivedScheduleReader';
import type { SharedSchedule } from '../../backend/domain/devices/sharedSchedule';
import { receivedSchedulesEn as text } from '../../constants/strings/receivedSchedulesEn';

export function useReceivedSchedules(
  service: ReceivedScheduleReader,
) {
  const [sources, setSources] = useState<
    readonly ReceivedScheduleSource[]
  >([]);
  const [source, setSource] =
    useState<ReceivedScheduleSource | null>(null);
  const [schedule, setSchedule] =
    useState<SharedSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const active = useRef(false);
  const request = useRef(0);

  const clear = useCallback(() => {
    request.current++;
    setSources([]);
    setSource(null);
    setSchedule(null);
    setBusy(false);
    setError('');
  }, []);

  const reload = useCallback(async () => {
    if (!active.current) return;

    const current = ++request.current;

    setBusy(true);
    setError('');
    setSources([]);
    setSource(null);
    setSchedule(null);

    try {
      const result = await service.list();

      if (active.current && request.current === current) {
        setSources(result);
      }
    } catch {
      if (active.current && request.current === current) {
        setError(text.failed);
      }
    } finally {
      if (active.current && request.current === current) {
        setBusy(false);
      }
    }
  }, [service]);

  const open = useCallback(async (fingerprint: string) => {
    if (!active.current) return;

    const current = ++request.current;

    setBusy(true);
    setError('');
    setSource(null);
    setSchedule(null);

    try {
      const result = await service.open(fingerprint);

      if (active.current && request.current === current) {
        setSource(result.source);
        setSchedule(result.schedule);
      }
    } catch {
      if (active.current && request.current === current) {
        setError(text.failed);
      }
    } finally {
      if (active.current && request.current === current) {
        setBusy(false);
      }
    }
  }, [service]);

  useFocusEffect(useCallback(() => {
    active.current = true;
    void reload();

    const subscription = AppState.addEventListener(
      'change',
      state => {
        if (state === 'active') {
          active.current = true;
          void reload();
        } else {
          active.current = false;
          clear();
        }
      },
    );

    return () => {
      active.current = false;
      subscription.remove();
      clear();
    };
  }, [clear, reload]));

  return {
    sources,
    source,
    schedule,
    busy,
    error,
    reload,
    open,
  };
}