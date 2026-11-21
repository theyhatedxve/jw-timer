import { styles } from '../../styles/timer/timerSession.styles';
import { ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Action from '../common/ActionButton';

import { PART_TITLES } from '../../../backend/domain/timer/timer';
import type { useTimerSession } from '../../hooks/useTimerSession';

function AwakeWhilePresented() {
  useKeepAwake('jw-timer-presentation', { suppressDeactivateWarnings: true });
  return null;
}

export default function TimerSessionView({ timer, pendingRecovery, ready, error, dbInfo, savedAt, fullscreen, active, keepAwake, setKeepAwake, overtime, stateLabel, locked, digits, displaySize, confirmReset, restoreCheckpoint, restartRecoveredPart, toggleRunning, advancePart, retrySaving, toggleFullscreen, loadShortParts, loadLongParts, openDiagnostics }: ReturnType<typeof useTimerSession>) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" hidden={fullscreen && active} />
      {fullscreen && active && keepAwake && <AwakeWhilePresented />}
      <ScrollView contentContainerStyle={[styles.content, fullscreen && styles.presentation]}>
        {!fullscreen && <>
          <Text accessibilityRole="header" style={styles.heading}>JW Timer</Text>
          <Text style={styles.secondary}>Phase 0 · Native feasibility prototype</Text>
          <Text style={styles.secondary}>Synthetic parts only · Everything stays on this device</Text>
        </>}

        {error !== '' && <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.text}>{error}</Text>
          {ready && !pendingRecovery && <Action label="Retry saving" onPress={retrySaving} />}
        </View>}

        {pendingRecovery && <View style={styles.notice}>
          <Text accessibilityRole="header" style={styles.subheading}>Recover saved timer?</Text>
          <Text style={styles.text}>{PART_TITLES[pendingRecovery.partIndex]} · {pendingRecovery.durationMs / 1000} seconds allotted</Text>
          <Text style={styles.text}>Checkpoint: {new Date(pendingRecovery.savedAtMs).toLocaleString()}</Text>
          <Text style={styles.text}>Saved elapsed: {Math.floor(pendingRecovery.elapsedMs / 1000)} seconds. This may be older than the interruption. Time while closed is excluded.</Text>
          <Action label={pendingRecovery.status === 'ready' ? 'Restore part ready' : 'Restore checkpoint paused'} onPress={restoreCheckpoint} />
          <Action label="Restart part and wait" onPress={restartRecoveredPart} />
        </View>}

        {!pendingRecovery && <View style={styles.timerCard}>
          <Text style={styles.subheading}>{PART_TITLES[timer.partIndex]}</Text>
          <Text style={[styles.status, overtime && styles.overtime]}>{stateLabel}</Text>
          <Text accessibilityLabel={`${stateLabel}: ${digits}`} accessibilityLiveRegion="none"
            style={[styles.digits, { fontSize: displaySize }, overtime && styles.overtime]}>{digits}</Text>
          <Text style={styles.secondary}>{overtime ? 'Overtime · advance when the part ends' : 'Every part waits for Start'}</Text>
          <View style={styles.actions}>
            <Action label={timer.status === 'running' ? 'Pause' : timer.status === 'paused' ? 'Resume' : 'Start'}
              disabled={locked || timer.status === 'completed'} onPress={toggleRunning} />
            <Action label={timer.partIndex === PART_TITLES.length - 1 ? 'Finish program' : 'Next part'}
              disabled={locked || timer.status === 'completed'} onPress={advancePart} />
            <Action label="Restart part" disabled={locked} onPress={confirmReset} />
          </View>
          <Action label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} disabled={!fullscreen && locked}
            onPress={toggleFullscreen} />
        </View>}

        {!fullscreen && <>
          <View style={styles.row}>
            <Text style={[styles.text, styles.flex]}>Keep screen awake in fullscreen</Text>
            <Switch accessibilityLabel="Keep screen awake in fullscreen" value={keepAwake} onValueChange={setKeepAwake} />
          </View>
          <Text style={styles.secondary}>Leaving the app pauses timing. Returning never starts it. Rotate the phone to check both layouts.</Text>
          <View style={styles.actions}>
            <Action label="Load 10-second parts" disabled={locked || timer.status === 'running'} onPress={loadShortParts} />
            <Action label="Load 60-minute parts" disabled={locked || timer.status === 'running'} onPress={loadLongParts} />
          </View>
          <Text style={styles.secondary}>{dbInfo}</Text>
          <Action label="Open SQLite checks" disabled={locked || timer.status === 'running'}
            onPress={openDiagnostics} />
          <Text style={styles.secondary}>{savedAt ? `Last checkpoint: ${new Date(savedAt).toLocaleTimeString()}` : 'No checkpoint saved yet'}</Text>
          <Text style={styles.secondary}>Phase 0 is pending hardware checks. No PDF import, schedule sharing or production data.</Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}


