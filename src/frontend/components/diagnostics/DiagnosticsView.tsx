import { styles } from '../../styles/diagnostics/diagnostics.styles';
import { ActivityIndicator, Pressable, ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../../constants/theme';
import type { useSqliteChecks } from '../../hooks/useSqliteChecks';

export default function DiagnosticsView({ results, busy, run, onBack }: ReturnType<typeof useSqliteChecks>) {
  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>SQLite checks</Text>
      <Text style={styles.text}>Phase 0 diagnostic tools. Runs only when you press the button. Uses synthetic records in a separate disposable database; the saved timer checkpoint is not opened.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }}
        disabled={busy} onPress={run} style={[styles.button, busy && styles.disabled]}>
        <Text style={styles.buttonText}>{busy ? 'Running checks…' : 'Run SQLite checks'}</Text>
      </Pressable>
      {busy && <ActivityIndicator accessibilityLabel="Running SQLite checks" color={colors.brand} />}
      {results && <>
        <Text accessibilityLiveRegion="polite" style={styles.text}>
          {results.every(result => result.passed) ? 'All reported checks passed.' : 'A check failed. Report the details below.'}
        </Text>
        {results.map((result, index) => <Text key={`${index}-${result.name}`}
          selectable style={[styles.result, !result.passed && styles.failed]}>
          {result.passed ? 'PASS' : 'FAIL'} · {result.name}{'\n'}{result.detail}
        </Text>)}
      </>}
      <Text style={styles.text}>These checks exercise native SQLite behavior. They do not prove production migrations, power-loss recovery, disk-full handling or encrypted backups.</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }}
        disabled={busy} style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </ScrollView>
  </SafeAreaView>;
}


