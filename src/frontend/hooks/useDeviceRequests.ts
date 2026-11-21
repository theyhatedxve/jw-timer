import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';

import type {
  DeviceRequestService,
} from '../../backend/services/deviceRequestService';

import {
  PairingFailure,
  type DeviceRequest,
} from '../../backend/domain/devices/deviceInvitation';

import { deviceRequestsEn as text } from '../../constants/strings/deviceRequestsEn';

export function useDeviceRequests(service: DeviceRequestService) {
  const [ownInvitation, setOwnInvitation] = useState('');
  const [requests, setRequests] = useState<readonly DeviceRequest[]>([]);
  const [label, setLabel] = useState('');
  const [invitation, setInvitation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mounted = useRef(false);
  const working = useRef(false);

  usePreventRemove(busy, () => {
    Alert.alert(text.title, text.wait);
  });

  async function refreshData() {
    const result = await service.load();

    if (mounted.current) {
      setOwnInvitation(result.invitation);
      setRequests(result.requests);
    }
  }

  async function perform(action: () => Promise<void>) {
    if (working.current) return;

    working.current = true;
    setBusy(true);
    setError('');

    try {
      await action();
      await refreshData();
    } catch (failure) {
      if (mounted.current) {
        setError(
          failure instanceof PairingFailure
            ? text.errors[failure.code]
            : text.errors.storage,
        );
      }
    } finally {
      working.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    void perform(async () => {});

    return () => { mounted.current = false; };
  }, [service]);

  return {
    ownInvitation,
    requests,
    label,
    setLabel,
    invitation,
    setInvitation,
    busy,
    error,
    refresh: () => perform(async () => {}),
    add: () => perform(async () => {
      await service.add(label, invitation);

      if (mounted.current) {
        setLabel('');
        setInvitation('');
      }
    }),
    revoke: (fingerprint: string) => perform(
      () => service.revoke(fingerprint),
    ),
  };
}