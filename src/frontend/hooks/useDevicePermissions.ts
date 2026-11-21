import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  useFocusEffect,
  usePreventRemove,
} from '@react-navigation/native';

import type {
  DevicePermissionService,
} from '../../backend/services/devicePermissionService';

import {
  PermissionFailure,
} from '../../backend/domain/devices/devicePermissions';

import { devicePermissionsEn as text } from '../../constants/strings/devicePermissionsEn';

type PermissionData = Awaited<
  ReturnType<DevicePermissionService['load']>
>;

export function useDevicePermissions(
  service: DevicePermissionService,
  fingerprint: string,
) {
  const [data, setData] = useState<PermissionData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mounted = useRef(false);
  const working = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  usePreventRemove(busy, () => {
    Alert.alert(text.title, text.wait);
  });

  async function perform(action: () => Promise<void>) {
    if (working.current) return;

    working.current = true;
    setBusy(true);
    setError('');

    try {
      await action();
      const next = await service.load(fingerprint);

      if (mounted.current) setData(next);
    } catch (failure) {
      if (mounted.current) {
        setData(null);
        setError(
          failure instanceof PermissionFailure
            ? text.errors[failure.code]
            : text.errors.storage,
        );
      }
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  useFocusEffect(useCallback(() => {
    void perform(async () => {});
  }, [service, fingerprint]));

  function toggle() {
    if (!data || working.current) return;

    const current = data;

    const save = () => {
      void perform(() => service.set({
        congregationId: current.congregationId,
        peerFingerprint: fingerprint,
        peerRevision: current.peerRevision,
        grantRevision: current.grantRevision,
        enabled: !current.allowed,
      }));
    };

    if (current.allowed) {
      save();
    } else {
      Alert.alert(
        text.title,
        text.confirmMessage(current.label, current.congregationName),
        [
          { text: text.cancel, style: 'cancel' },
          { text: text.confirm, onPress: save },
        ],
      );
    }
  }

  return {
    data,
    busy,
    error,
    toggle,
    refresh: () => perform(async () => {}),
  };
}