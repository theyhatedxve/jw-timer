import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/ActionButton';
import { styles } from '../../styles/publishers/publishers.styles';
import { backupChecksEn as text } from '../../../constants/strings/backupChecksEn';

import type { useBackupChecks } from '../../hooks/useBackupChecks';

export default function BackupChecksView(
  model: ReturnType<typeof useBackupChecks>,
) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.text}>{text.description}</Text>

        <ActionButton
          label={model.busy ? text.running : text.run}
          disabled={model.busy}
          onPress={model.run}
        />

        {model.results ? (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={styles.heading}
            >
              {model.results.length > 0 &&
              model.results.every(result => result.passed)
                ? text.passed
                : text.failed}
            </Text>

            {model.results.map(result => (
              <View key={result.name} style={styles.group}>
                <Text
                  selectable
                  style={result.passed ? styles.text : styles.error}
                >
                  {result.passed ? 'PASS' : 'FAIL'}: {result.name}
                  {'\n'}{result.detail}
                </Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={styles.secondary}>{text.limitation}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}