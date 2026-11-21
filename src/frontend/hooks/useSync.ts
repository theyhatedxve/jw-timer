import { useCallback, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { SyncService } from '../../backend/services/syncService';
import type { SyncPreview, SyncStatus } from '../../backend/domain/sync/syncTypes';
import { syncEn as text } from '../../constants/strings/syncEn';
import { parseLanConnection } from '../../backend/domain/devices/lanConnection';
import { SyncFailure } from '../../backend/domain/sync/syncTypes';

export function useSync(service: SyncService) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [preview, setPreview] = useState<SyncPreview | null>(null);
  const [selected, setSelected] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const active = useRef(false);
  const generation = useRef(0);
  const working = useRef(false);
  const staged = useRef<SyncPreview | null>(null);
  const invalidate = useCallback(() => {
    generation.current++;
    service.cancel();
    staged.current = null;
    if (active.current) { setPreview(null); setStatus(null); setBusy(false); }
  }, [service]);

  const run = useCallback(async (action: (current: () => boolean) => Promise<void>) => {
    if (!active.current || working.current) return;
    working.current = true;
    const token = generation.current;
    const current = () => active.current && generation.current === token;
    setBusy(true); setMessage('');
    try {
      await action(current);
    } catch (error) {
      if (current()) { service.cancel(); staged.current = null; setPreview(null); setMessage(error instanceof SyncFailure ? text.errors[error.code] : text.failed); }
    } finally {
      working.current = false;
      if (active.current) setBusy(false);
    }
  }, [service]);
  const refresh = useCallback(() => run(async current => {
    const value = await service.status();
    if (current()) { setStatus(value); setMessage(text.updated); }
  }), [run, service]);
  useFocusEffect(useCallback(() => {
    active.current = true;
    setPreview(null); setStatus(null); setBusy(working.current);
    void refresh();
    const lifecycle = AppState.addEventListener('change', state => {
      if (state !== 'active') { invalidate(); active.current = false; }
      else { active.current = true; setBusy(working.current); void refresh(); }
    });
    return () => { active.current = false; invalidate(); lifecycle.remove(); };
  }, [invalidate, refresh]));

  function confirm(title: string, question: string, action: () => Promise<void>, expectedPreview?: SyncPreview) {
    if (working.current || !active.current) return;
    const token = generation.current;
    Alert.alert(title, question, [
      { text: text.cancel, style: 'cancel' },
      { text: text.confirm, onPress: () => {
        if (!active.current || token !== generation.current || (expectedPreview && staged.current !== expectedPreview)) return;
        void run(async current => {
          await action();
          if (!current()) return;
          service.cancel(); staged.current = null; setPreview(null);
          const value = await service.status();
          if (current()) { setStatus(value); setMessage(title === text.submit ? text.queued : text.updated); }
        });
      } },
    ]);
  }
  const makePreview = (action: () => Promise<SyncPreview>) => run(async current => {
    service.cancel(); staged.current = null; setPreview(null);
    const value = await action();
    if (current()) { staged.current = value; setPreview(value); }
  });
  const isLeader = !!status?.binding && status.binding.leader === status.ownFingerprint;
  let connectionMatches = false;
  try { connectionMatches = !!selected && status?.peers.some(peer => peer.fingerprint === selected) === true && parseLanConnection(code).fingerprint === selected; } catch { /* Manual, QR and discovery input share the same validation. */ }
  return { status, preview: active.current ? preview : null, selected, code, busy, message, isLeader, connectionMatches,
    refresh,
    setSelected: (value: string) => { if (working.current) return; invalidate(); setSelected(value); setCode(''); },
    setCode: (value: string) => { if (working.current) return; invalidate(); setCode(value); },
    discard: invalidate,
    bindSelf: () => confirm(text.bind, text.bindQuestion, () => service.bindSelf()),
    adopt: () => { if (connectionMatches) confirm(text.adopt, `${text.adoptQuestion}\n\n${selected}`, () => service.adopt(selected, code)); },
    setEditor: (fingerprint: string, enabled: boolean) => confirm(enabled ? text.grant : text.revoke, `${text.grantQuestion}\n\n${fingerprint}`, () => service.setEditor(fingerprint, enabled)),
    previewLocal: () => makePreview(() => service.previewLocal()),
    previewRestored: (index: number) => makePreview(() => service.previewRestored(index)),
    previewProposal: (id: string) => makePreview(() => service.previewProposal(id)),
    publish: () => { if (preview) confirm(text.publish, text.replaceQuestion, () => service.publish(), preview); },
    submit: () => { if (preview) confirm(text.submit, text.submitQuestion, () => service.queueProposal(), preview); },
    reject: (id: string) => confirm(text.reject, text.rejectQuestion, () => service.rejectProposal(id)),
    synchronize: () => run(async current => {
      if (!connectionMatches) return;
      service.cancel(); staged.current = null; setPreview(null);
      await service.synchronize(code);
      if (!current()) return;
      const value = await service.status();
      if (current()) { setStatus(value); setMessage(text.updated); }
    }),
    retry: () => run(async current => {
      if (!connectionMatches) return;
      await service.retry(code);
      const value = await service.status();
      if (current()) { setStatus(value); setMessage(text.updated); }
    }),
  };
}
