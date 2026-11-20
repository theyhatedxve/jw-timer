import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Action from '../common/ActionButton';
import { colors } from '../../constants/theme';
import { PART_TITLES } from '../../state/timer/timer';
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { flexGrow: 1, padding: 20, gap: 16, width: '100%', maxWidth: 800, alignSelf: 'center' },
  presentation: { justifyContent: 'center' },
  heading: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subheading: { color: colors.text, fontSize: 22, fontWeight: '600', textAlign: 'center' },
  text: { color: colors.text, fontSize: 16, lineHeight: 25 },
  secondary: { color: colors.secondary, fontSize: 14, lineHeight: 22 },
  timerCard: { backgroundColor: colors.surface, padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: colors.border },
  digits: { color: colors.text, fontWeight: '700', fontVariant: ['tabular-nums'], textAlign: 'center' },
  status: { color: colors.brand, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  overtime: { color: colors.danger },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  button: { minHeight: 48, minWidth: 48, paddingHorizontal: 20, paddingVertical: 14, backgroundColor: colors.brand, borderRadius: 10, justifyContent: 'center' },
  buttonText: { color: colors.onBrand, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  disabled: { backgroundColor: colors.disabled, opacity: 0.7 },
  pressed: { opacity: 0.8 },
  notice: { gap: 12, padding: 16, borderRadius: 12, borderColor: colors.warning, borderWidth: 1, backgroundColor: colors.warningBackground },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48 },
  flex: { flex: 1 },
});
