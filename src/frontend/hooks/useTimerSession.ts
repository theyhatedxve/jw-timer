import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AccessibilityInfo,
  Alert,
  AppState,
  BackHandler,
  useWindowDimensions,
} from 'react-native';

import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from '@react-navigation/native';

import { NavigationBar } from 'expo-navigation-bar';

import {
  elapsed,
  formatTime,
  next,
  pause,
  restart,
  start,
  type TimerState,
} from '../../backend/domain/timer/timer';

import {
  createProgramTimer,
  restoreSession,
  type SessionCheckpoint,
  type TimerProgram,
} from '../../backend/domain/timer/timerProgram';

import type {
  TimerSessionService,
} from '../../backend/services/timerSessionService';

import type {
  TimerProgramRequest,
} from '../navigation/types';

interface Runtime {
  readonly program: TimerProgram;
  readonly timer: TimerState;
}

export function useTimerSession(
  service: TimerSessionService,
  request: TimerProgramRequest | undefined,
) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const { width, fontScale } = useWindowDimensions();

  const [session, setSession] = useState<Runtime>(() => {
    const program = service.practice();

    return {
      program,
      timer: createProgramTimer(program),
    };
  });

  const current = useRef(session);
  const initialized = useRef(false);
  const hasCheckpoint = useRef(false);
  const storageFailed = useRef(false);
  const promptActive = useRef(false);
  const handledRequest = useRef<string | null>(null);
  const latestRequest = useRef<string | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dbInfo, setDbInfo] = useState('Opening local storage…');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pendingRecovery, setPendingRecovery] =
    useState<SessionCheckpoint | null>(null);

  const recovery = useRef<SessionCheckpoint | null>(null);

  const [promptOpen, setPromptOpen] = useState(false);
  const [now, setNow] = useState(() => performance.now());
  const [fullscreen, setFullscreen] = useState(false);
  const [active, setActive] = useState(
    AppState.currentState === 'active',
  );
  const [keepAwake, setKeepAwake] = useState(true);

  const requestKey = request
    ? `${request.requestId}:${request.meetingId}`
    : null;

  useEffect(() => {
    latestRequest.current = requestKey;
  }, [requestKey]);

  const show = useCallback((value: Runtime) => {
    current.current = value;
    setSession(value);
    setNow(performance.now());
  }, []);

  const commit = useCallback((value: Runtime): boolean => {
    try {
      const saved = service.save(
        value.program,
        value.timer,
        performance.now(),
        Date.now(),
      );

      hasCheckpoint.current = true;
      storageFailed.current = false;
      setSavedAt(saved.savedAtMs);
      setError('');
      show(value);
      return true;
    } catch {
      const previous = current.current;

      show({
        ...previous,
        timer: pause(previous.timer, performance.now()),
      });

      storageFailed.current = true;

      setError(
        'Checkpoint could not be saved. Timing is paused. Free storage, then retry saving.',
      );

      return false;
    }
  }, [service, show]);

  useEffect(() => {
    try {
      const saved = service.load();

      setDbInfo(service.info());

      if (saved) {
        hasCheckpoint.current = true;
        setSavedAt(saved.savedAtMs);

        show({
          program: saved.program,
          timer: restoreSession(saved),
        });

        if (saved.status !== 'completed') {
          recovery.current = saved;
          setPendingRecovery(saved);
        }
      }

      initialized.current = true;
      setReady(true);
    } catch {
      storageFailed.current = true;

      setError(
        'Local storage could not be opened or its checkpoint is invalid. Existing data was preserved.',
      );
    }
  }, [service, show]);

  useEffect(() => {
    let lastSave = performance.now();

    const ticker = setInterval(() => {
      const tick = performance.now();
      const value = current.current;

      setNow(tick);

      if (
        initialized.current &&
        !storageFailed.current &&
        value.timer.status === 'running' &&
        tick - lastSave >= 1000
      ) {
        lastSave = tick;
        commit(value);
      }
    }, 100);

    const lifecycle = AppState.addEventListener(
      'change',
      state => {
        setActive(state === 'active');

        if (state !== 'active') {
          setFullscreen(false);

          const value = current.current;

          if (value.timer.status === 'running') {
            commit({
              ...value,
              timer: pause(value.timer, performance.now()),
            });
          }
        }
      },
    );

    return () => {
      clearInterval(ticker);
      lifecycle.remove();
    };
  }, [commit]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setFullscreen(false);

        const value = current.current;

        if (value.timer.status === 'running') {
          commit({
            ...value,
            timer: pause(value.timer, performance.now()),
          });
        }
      };
    }, [commit]),
  );

  useEffect(() => {
    if (!focused) return;

    NavigationBar.setHidden(fullscreen && active);

    const back = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!fullscreen || !active) return false;

        setFullscreen(false);
        return true;
      },
    );

    return () => {
      back.remove();
      NavigationBar.setHidden(false);
    };
  }, [focused, fullscreen, active]);

  const replaceProgram = useCallback((
    program: TimerProgram,
  ) => {
    const replaced = commit({
      program,
      timer: createProgramTimer(program),
    });

    if (replaced) {
      recovery.current = null;
      setPendingRecovery(null);
      setNotice('');
      setFullscreen(false);
    }
  }, [commit]);

  const requestReplacement = useCallback((
    program: TimerProgram,
    expectedRequestKey?: string,
  ) => {
    if (
      !initialized.current ||
      storageFailed.current ||
      promptActive.current
    ) {
      return;
    }

    const existing = current.current;

    if (
      !hasCheckpoint.current ||
      existing.timer.status === 'completed'
    ) {
      replaceProgram(program);
      return;
    }

    if (
      existing.timer.status === 'running' &&
      !commit({
        ...existing,
        timer: pause(existing.timer, performance.now()),
      })
    ) {
      return;
    }

    promptActive.current = true;
    setPromptOpen(true);

    let settled = false;

    function finish(accept: boolean) {
      if (settled) return;
      settled = true;

      promptActive.current = false;
      setPromptOpen(false);

      if (
        accept &&
        navigation.isFocused() &&
        (
          expectedRequestKey === undefined ||
          latestRequest.current === expectedRequestKey
        )
      ) {
        replaceProgram(program);
      }
    }

    Alert.alert(
      'Replace unfinished timer?',
      `Load "${program.title}" and discard the current timer progress?`,
      [
        {
          text: 'Keep current',
          style: 'cancel',
          onPress: () => finish(false),
        },
        {
          text: 'Load program',
          style: 'destructive',
          onPress: () => finish(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => finish(false),
      },
    );
  }, [commit, navigation, replaceProgram]);

  useEffect(() => {
    if (
      !ready ||
      !focused ||
      !request ||
      !requestKey ||
      promptOpen ||
      storageFailed.current ||
      handledRequest.current === requestKey
    ) {
      return;
    }

    handledRequest.current = requestKey;

    const result = service.forMeeting(request.meetingId);

    if (!result.ok) {
      setNotice(result.error.message);
      return;
    }

    setNotice('');
    requestReplacement(result.value, requestKey);
  }, [
    ready,
    focused,
    request,
    requestKey,
    promptOpen,
    error,
    service,
    requestReplacement,
  ]);

  function canControl(): boolean {
    return (
      initialized.current &&
      !storageFailed.current &&
      recovery.current === null &&
      !promptActive.current
    );
  }

  function restoreCheckpoint() {
    const saved = recovery.current;

    if (!saved || promptActive.current) return;

    if (commit({
      program: saved.program,
      timer: restoreSession(saved),
    })) {
      recovery.current = null;
      setPendingRecovery(null);
    }
  }

  function restartRecoveredPart() {
    const saved = recovery.current;

    if (!saved || promptActive.current) return;

    if (commit({
      program: saved.program,
      timer: restart(restoreSession(saved)),
    })) {
      recovery.current = null;
      setPendingRecovery(null);
    }
  }

  function toggleRunning() {
    if (!canControl()) return;

    const value = current.current;

    commit({
      ...value,
      timer: value.timer.status === 'running'
        ? pause(value.timer, performance.now())
        : start(value.timer, performance.now()),
    });
  }

  function advancePart() {
    if (!canControl()) return;

    const value = current.current;

    commit({
      ...value,
      timer: next(
        value.timer,
        performance.now(),
        value.program.parts.map(part => part.durationMs),
      ),
    });
  }

  function confirmReset() {
    if (!canControl()) return;

    Alert.alert(
      'Restart this part?',
      'Elapsed time will be cleared. The part will wait for Start.',
      [
        { text: 'Keep current', style: 'cancel' },
        {
          text: 'Restart part',
          onPress: () => {
            if (!canControl()) return;

            const value = current.current;

            commit({
              ...value,
              timer: restart(value.timer),
            });
          },
        },
      ],
    );
  }

  const { program, timer } = session;
  const overtime = elapsed(timer, now) >= timer.durationMs;

  const stateLabel =
    timer.status === 'running' && overtime
      ? 'Overtime'
      : {
          ready: 'Ready to start',
          running: 'Running',
          paused: 'Paused',
          completed: 'Program completed',
        }[timer.status];

  useEffect(() => {
    if (focused && ready && !pendingRecovery) {
      AccessibilityInfo.announceForAccessibility(stateLabel);
    }
  }, [focused, ready, pendingRecovery, stateLabel]);

  const digits = formatTime(timer, now);

  const displaySize = Math.max(
    22,
    Math.min(
      fullscreen ? 120 : 76,
      (Math.min(width, 800) - 80) /
        (digits.length * 0.68 * fontScale),
    ),
  );

  return {
    program,
    timer,
    pendingRecovery,
    ready,
    error,
    notice,
    dbInfo,
    savedAt,
    fullscreen,
    active: active && focused,
    keepAwake,
    setKeepAwake,
    overtime,
    stateLabel,
    locked:
      !ready ||
      pendingRecovery !== null ||
      error !== '' ||
      promptOpen,
    digits,
    displaySize,
    partTitle:
      program.parts[timer.partIndex]?.title ?? 'Unavailable part',
    recoveryTitle: pendingRecovery
      ?.program.parts[pendingRecovery.partIndex]?.title ?? '',
    isLastPart: timer.partIndex === program.parts.length - 1,
    confirmReset,
    restoreCheckpoint,
    restartRecoveredPart,
    toggleRunning,
    advancePart,
    retrySaving: () => commit(current.current),
    toggleFullscreen: () => {
      setFullscreen(value => !value);
    },
    loadShortParts: () => {
      requestReplacement(service.practice(10_000));
    },
    loadLongParts: () => {
      requestReplacement(service.practice(3_600_000));
    },
    openDiagnostics: () => navigation.navigate('Diagnostics'),
  };
}