import { ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { backupEn as text } from '../../../constants/strings/backupEn';

import type { useBackups } from '../../hooks/useBackups';

type Props = ReturnType<typeof useBackups>;

export default function BackupsView(model: Props) {
  const styles = useDocumentStyles();
  const disabled = model.busy || model.restored;

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.text}>{text.guidance}</Text>

        <Text style={styles.secondary}>{text.password}</Text>
        <TextInput
          accessibilityLabel={text.password}
          value={model.password}
          onChangeText={model.setPassword}
          editable={!disabled}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          maxLength={128}
          style={styles.input}
        />

        <Text style={styles.secondary}>{text.confirmation}</Text>
        <TextInput
          accessibilityLabel={text.confirmation}
          value={model.confirmation}
          onChangeText={model.setConfirmation}
          editable={!disabled}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          maxLength={128}
          style={styles.input}
        />

        <ActionButton
          label={text.export}
          disabled={disabled}
          onPress={model.exportBackup}
        />
        <ActionButton
          label={text.preview}
          disabled={disabled}
          onPress={model.previewBackup}
        />

        {model.busy ? (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            {text.wait}
          </Text>
        ) : null}

        {model.summary ? (
          <>
            <Text style={styles.heading}>
              {new Date(model.summary.createdAt).toLocaleString()}
            </Text>
            <Text style={styles.text}>
              {text.summary(
                model.summary.meetings,
                model.summary.publishers,
                model.summary.assignments,
                model.summary.historicalRows,
              )}
            </Text>
            <Text style={styles.error}>{text.replacement}</Text>
            <ActionButton
              label={text.restore}
              disabled={disabled}
              onPress={model.restoreBackup}
            />
          </>
        ) : null}

        {model.message ? (
          <Text accessibilityRole="alert" style={styles.text}>
            {model.message}
          </Text>
        ) : null}

        {model.restored ? (
          <ActionButton
            label={text.restart}
            onPress={model.restart}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
