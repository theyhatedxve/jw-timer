import {
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

import Action from '../common/ActionButton';
import { styles } from '../../styles/timer/timerSession.styles';

import type { useTimerSession } from '../../hooks/useTimerSession';

function AwakeWhilePresented() {
  useKeepAwake('jw-timer-presentation', {
    suppressDeactivateWarnings: true,
  });

  return null;
}

export default function TimerSessionView(
  model: ReturnType<typeof useTimerSession>,
) {
  const { program, timer, pendingRecovery } = model;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        style="light"
        hidden={model.fullscreen && model.active}
      />

      {model.fullscreen && model.active && model.keepAwake ? (
        <AwakeWhilePresented />
      ) : null}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          model.fullscreen && styles.presentation,
        ]}
      >
        {!model.fullscreen ? (
          <>
            <Text
              accessibilityRole="header"
              style={styles.heading}
            >
              {program.title}
            </Text>

            <Text style={styles.secondary}>
              {program.meetingId
                ? `Saved meeting · revision ${program.revision}`
                : 'Practice program'}
            </Text>

            <Text style={styles.secondary}>
              {program.parts.length} timed parts.
              {' '}Every part waits for Start.
            </Text>
          </>
        ) : null}

        {model.notice ? (
          <View style={styles.notice}>
            <Text
              accessibilityRole="alert"
              style={styles.text}
            >
              {model.notice}
            </Text>
          </View>
        ) : null}

        {model.error ? (
          <View style={styles.notice}>
            <Text
              accessibilityRole="alert"
              style={styles.text}
            >
              {model.error}
            </Text>

            {model.ready && !pendingRecovery ? (
              <Action
                label="Retry saving"
                onPress={model.retrySaving}
              />
            ) : null}
          </View>
        ) : null}

        {pendingRecovery ? (
          <View style={styles.notice}>
            <Text
              accessibilityRole="header"
              style={styles.subheading}
            >
              Recover saved timer?
            </Text>

            <Text style={styles.text}>
              {pendingRecovery.program.title}
              {' · '}
              {model.recoveryTitle}
            </Text>

            <Text style={styles.text}>
              Checkpoint:{' '}
              {new Date(
                pendingRecovery.savedAtMs,
              ).toLocaleString()}
            </Text>

            <Text style={styles.text}>
              Saved elapsed:{' '}
              {Math.floor(pendingRecovery.elapsedMs / 1000)}
              {' '}seconds. This may be older than the
              interruption. Time while closed is excluded.
            </Text>

            <Action
              label={
                pendingRecovery.status === 'ready'
                  ? 'Restore part ready'
                  : 'Restore checkpoint paused'
              }
              onPress={model.restoreCheckpoint}
            />

            <Action
              label="Restart part and wait"
              onPress={model.restartRecoveredPart}
            />
          </View>
        ) : (
          <View style={styles.timerCard}>
            <Text style={styles.subheading}>
              {model.partTitle}
            </Text>

            <Text style={styles.secondary}>
              Part {timer.partIndex + 1} of {program.parts.length}
              {' · '}
              {timer.durationMs / 1000} seconds allotted
            </Text>

            <Text
              style={[
                styles.status,
                model.overtime && styles.overtime,
              ]}
            >
              {model.stateLabel}
            </Text>

            <Text
              accessibilityLabel={
                `${model.stateLabel}: ${model.digits}`
              }
              accessibilityLiveRegion="none"
              style={[
                styles.digits,
                { fontSize: model.displaySize },
                model.overtime && styles.overtime,
              ]}
            >
              {model.digits}
            </Text>

            <Text style={styles.secondary}>
              {model.overtime
                ? 'Overtime · advance when the part ends'
                : 'Press Start to begin this part'}
            </Text>

            <View style={styles.actions}>
              <Action
                label={
                  timer.status === 'running'
                    ? 'Pause'
                    : timer.status === 'paused'
                      ? 'Resume'
                      : 'Start'
                }
                disabled={
                  model.locked ||
                  timer.status === 'completed'
                }
                onPress={model.toggleRunning}
              />

              <Action
                label={
                  model.isLastPart
                    ? 'Finish program'
                    : 'Next part'
                }
                disabled={
                  model.locked ||
                  timer.status === 'completed'
                }
                onPress={model.advancePart}
              />

              <Action
                label="Restart part"
                disabled={model.locked}
                onPress={model.confirmReset}
              />
            </View>

            <Action
              label={
                model.fullscreen
                  ? 'Exit fullscreen'
                  : 'Enter fullscreen'
              }
              disabled={!model.fullscreen && model.locked}
              onPress={model.toggleFullscreen}
            />
          </View>
        )}

        {!model.fullscreen ? (
          <>
            <View style={styles.row}>
              <Text style={[styles.text, styles.flex]}>
                Keep screen awake in fullscreen
              </Text>

              <Switch
                accessibilityLabel="Keep screen awake in fullscreen"
                value={model.keepAwake}
                onValueChange={model.setKeepAwake}
              />
            </View>

            <Text style={styles.secondary}>
              Leaving this screen or backgrounding the app
              pauses timing. Returning never starts it.
            </Text>

            <Text style={styles.secondary}>
              Meeting edits do not change the loaded program.
              Open it again from Meetings to load a newer version.
            </Text>

            <View style={styles.actions}>
              <Action
                label="Load 10-second practice program"
                disabled={
                  model.locked ||
                  timer.status === 'running'
                }
                onPress={model.loadShortParts}
              />

              <Action
                label="Load 60-minute practice program"
                disabled={
                  model.locked ||
                  timer.status === 'running'
                }
                onPress={model.loadLongParts}
              />
            </View>

            <Text style={styles.secondary}>
              {model.dbInfo}
            </Text>

            <Action
              label="Open SQLite checks"
              disabled={
                model.locked ||
                timer.status === 'running'
              }
              onPress={model.openDiagnostics}
            />

            <Text style={styles.secondary}>
              {model.savedAt
                ? `Last checkpoint: ${
                    new Date(model.savedAt).toLocaleTimeString()
                  }`
                : 'No checkpoint saved yet'}
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}