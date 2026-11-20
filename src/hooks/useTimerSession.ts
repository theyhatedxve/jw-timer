import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, BackHandler, useWindowDimensions } from 'react-native';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NavigationBar } from 'expo-navigation-bar';
import {
  checkpoint, createTimer, elapsed, formatTime, next, pause, recover, restart, start,
  type TimerCheckpoint, type TimerState,
} from '../state/timer/timer';
import { loadCheckpoint, saveCheckpoint, storageInfo } from '../state/db/timerStorage';

export function useTimerSession() {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const [timer, setTimer] = useState<TimerState>(() => createTimer());
  const current = useRef(timer);
  const [pendingRecovery, setPendingRecovery] = useState<TimerCheckpoint | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [dbInfo, setDbInfo] = useState('Opening local storage…');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => performance.now());
  const [fullscreen, setFullscreen] = useState(false);
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [keepAwake, setKeepAwake] = useState(true);
  const { width, fontScale } = useWindowDimensions();

  function showState(value: TimerState) {
    current.current = value;
    setTimer(value);
    setNow(performance.now());
  }

  function persist(value: TimerState): boolean {
    try {
      const saved = checkpoint(value, performance.now(), Date.now());
      saveCheckpoint(saved);
      setSavedAt(saved.savedAtMs);
      setError('');
      return true;
    } catch {
      showState(pause(current.current, performance.now()));
      setError('Checkpoint could not be saved. Timing is paused. Free storage, then retry saving.');
      return false;
    }
  }

  function apply(value: TimerState) { if (persist(value)) showState(value); }

  useEffect(() => {
    try {
      const saved = loadCheckpoint();
      setDbInfo(storageInfo());
      if (saved) {
        setSavedAt(saved.savedAtMs);
        if (saved.status !== 'completed') setPendingRecovery(saved);
        else showState(recover(saved));
      }
      setReady(true);
    } catch {
      setError('Local storage could not be opened or its checkpoint is invalid. Existing data was preserved. Close the app and report this error.');
    }
  }, []);

  useEffect(() => {
    let lastSave = performance.now();
    const ticker = setInterval(() => {
      const tick = performance.now();
      setNow(tick);
      if (current.current.status === 'running' && tick - lastSave >= 1000) {
        lastSave = tick;
        persist(current.current);
      }
    }, 100);
    const lifecycle = AppState.addEventListener('change', (state) => {
      setActive(state === 'active');
      if (state !== 'active') {
        setFullscreen(false);
        if (current.current.status === 'running') apply(pause(current.current, performance.now()));
      }
    });
    return () => { clearInterval(ticker); lifecycle.remove(); };
  }, []);

  useEffect(() => {
    if (!focused) return;
    NavigationBar.setHidden(fullscreen && active);
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!fullscreen || !active) return false;
      setFullscreen(false);
      return true;
    });
    return () => { back.remove(); NavigationBar.setHidden(false); };
  }, [fullscreen, active, focused]);

  const overtime = elapsed(timer, now) >= timer.durationMs;
  const stateLabel = timer.status === 'running' && overtime ? 'Overtime' :
    ({ ready: 'Ready to start', running: 'Running', paused: 'Paused', completed: 'Program completed' }[timer.status]);
  useEffect(() => { AccessibilityInfo.announceForAccessibility(stateLabel); }, [stateLabel]);
  const locked = !ready || pendingRecovery !== null || error !== '';
  const digits = formatTime(timer, now);
  const displaySize = Math.max(22, Math.min(fullscreen ? 120 : 76, (Math.min(width, 800) - 80) / (digits.length * 0.68 * fontScale)));

  function confirmReset() {
    Alert.alert('Restart this part?', 'Elapsed time will be cleared. The part will wait for Start.', [
      { text: 'Keep timing', style: 'cancel' },
      { text: 'Restart part', onPress: () => apply(restart(current.current)) },
    ]);
  }
  function restoreCheckpoint() {
    if (!pendingRecovery) return;
    const restored = pause(recover(pendingRecovery), performance.now());
    if (persist(restored)) { showState(restored); setPendingRecovery(null); }
  }
  function restartRecoveredPart() {
    if (!pendingRecovery) return;
    const restored = restart(recover(pendingRecovery));
    if (persist(restored)) { showState(restored); setPendingRecovery(null); }
  }
  function toggleRunning() {
    if (locked) return;
    const value = current.current;
    apply(value.status === 'running' ? pause(value, performance.now()) : start(value, performance.now()));
  }
  function advancePart() { if (!locked) apply(next(current.current, performance.now())); }

  return {
    timer, pendingRecovery, ready, error, dbInfo, savedAt, fullscreen, active: active && focused, keepAwake, setKeepAwake,
    overtime, stateLabel, locked, digits, displaySize, confirmReset, restoreCheckpoint, restartRecoveredPart,
    toggleRunning, advancePart,
    retrySaving: () => persist(current.current),
    toggleFullscreen: () => setFullscreen((value) => !value),
    loadShortParts: () => apply(createTimer()),
    loadLongParts: () => apply(createTimer(3_600_000)),
    openDiagnostics: () => navigation.navigate('Diagnostics'),
  };
}
