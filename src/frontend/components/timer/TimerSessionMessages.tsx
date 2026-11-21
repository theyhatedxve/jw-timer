import { Text } from 'react-native';

import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentationEn } from '../../../constants/strings/timerPresentationEn';

import type { useTimerSession } from '../../hooks/useTimerSession';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';

type Model = ReturnType<typeof useTimerSession>;

export default function TimerSessionMessages({
  model,
}: {
  readonly model: Model;
}) {
  const saved = model.pendingRecovery;

  return (
    <>
      {model.notice ? (
        <AppCard>
          <Text accessibilityRole="alert" className="text-app-body text-app-text">
            {model.notice}
          </Text>
        </AppCard>
      ) : null}

      {model.error ? (
        <AppCard>
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">
            {model.error}
          </Text>

          {model.ready && !saved ? (
            <AppButton
              label={text.retrySaving}
              onPress={model.retrySaving}
            />
          ) : null}
        </AppCard>
      ) : null}

      {saved ? (
        <AppCard>
          <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
            {text.recover}
          </Text>

          <Text className="text-app-body text-app-text">
            {saved.program.title}
            {' · '}
            {model.recoveryTitle}
          </Text>

          <Text className="text-app-body text-app-secondary">
            {new Date(saved.savedAtMs).toLocaleString()}
            {' · '}
            {timerPresentationEn.savedElapsed(saved.elapsedMs)}
          </Text>

          <Text className="text-app-body text-app-text">
            {text.recoveryNote}
          </Text>

          <AppButton
            label={saved.status === 'ready'
              ? text.restoreReady
              : text.restorePaused}
            onPress={model.restoreCheckpoint}
          />

          <AppButton
            label={text.restartRecovered}
            onPress={model.restartRecoveredPart}
          />
        </AppCard>
      ) : null}
    </>
  );
}
