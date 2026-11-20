import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/theme';
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 20, gap: 16, maxWidth: 800, alignSelf: 'center', width: '100%' },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  text: { color: colors.secondary, fontSize: 16, lineHeight: 25 },
  button: { minHeight: 48, padding: 16, backgroundColor: colors.brand, borderRadius: 10 },
  buttonText: { color: colors.onBrand, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  disabled: { opacity: 0.6 },
  result: { color: colors.text, fontSize: 16, lineHeight: 25, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  failed: { color: colors.danger, borderColor: colors.danger },
});
