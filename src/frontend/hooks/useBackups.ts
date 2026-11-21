import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { usePreventRemove } from '@react-navigation/native';
import { reloadAppAsync } from 'expo';

import type { BackupService } from '../../backend/services/backupService';

import {
  BackupFailure,
  type BackupSummary,
} from '../../backend/domain/backups/backupFormat';

import { backupEn as text } from '../../constants/strings/backupEn';

export function useBackups(service: BackupService) {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);
  const [message, setMessage] = useState('');

  const mounted = useRef(false);
  const working = useRef(false);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
      service.clear();
    };
  }, [service]);

  usePreventRemove(busy || restored, () => {
    Alert.alert(
      text.title,
      restored ? text.restored : text.wait,
    );
  });

  async function restart() {
    try {
      await reloadAppAsync('Backup restored');
    } catch {
      if (mounted.current) setMessage(text.restored);
    }
  }

  async function perform(action: () => Promise<void>) {
    if (working.current || restored || !mounted.current) return;

    working.current = true;
    setBusy(true);
    setMessage('');

    try {
      await action();
    } catch (error) {
      if (mounted.current) {
        setMessage(
          error instanceof BackupFailure
            ? text.errors[error.code]
            : text.errors.invalid,
        );
      }
    } finally {
      working.current = false;

      if (mounted.current) {
        setBusy(false);
        setPassword('');
        setConfirmation('');
      }
    }
  }

  function exportBackup() {
    void perform(async () => {
      service.clear();
      setSummary(null);

      if (password !== confirmation) {
        throw new BackupFailure('password');
      }

      const saved = await service.export(password);

      if (mounted.current && saved) setMessage(text.saved);
    });
  }

  function previewBackup() {
    void perform(async () => {
      setSummary(null);
      const result = await service.preview(password);

      if (mounted.current) setSummary(result);
    });
  }

  function restoreBackup() {
    if (!summary || working.current || restored) return;

    Alert.alert(text.restore, text.replacement, [
      { text: text.cancel, style: 'cancel' },
      {
        text: text.replace,
        style: 'destructive',
        onPress: () => {
          void perform(async () => {
            service.restore();
            setSummary(null);
            setRestored(true);
            setMessage(text.restored);
            await restart();
          });
        },
      },
    ]);
  }

  return {
    password,
    setPassword,
    confirmation,
    setConfirmation,
    summary,
    busy,
    restored,
    message,
    exportBackup,
    previewBackup,
    restoreBackup,
    restart,
  };
}