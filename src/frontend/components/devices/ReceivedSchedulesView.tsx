import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ActionButton from '../common/AppButton';
import ReceivedScheduleView from './ReceivedScheduleView';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { receivedSchedulesEn as text } from '../../../constants/strings/receivedSchedulesEn';
import type { useReceivedSchedules } from '../../hooks/useReceivedSchedules';

export default function ReceivedSchedulesView(
  model: ReturnType<typeof useReceivedSchedules>,
) {
  const styles = useDocumentStyles();

  return (
    <SafeAreaView
      style={styles.screen}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.text}>{text.description}</Text>
        <Text style={styles.secondary}>{text.readOnly}</Text>

        <ActionButton
          label={text.refresh}
          disabled={model.busy}
          onPress={model.reload}
        />

        {model.busy ? (
          <Text
            accessibilityLiveRegion="polite"
            style={styles.text}
          >
            {text.loading}
          </Text>
        ) : null}

        {model.error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {model.error}
          </Text>
        ) : null}

        {!model.busy &&
        !model.error &&
        model.sources.length === 0 ? (
          <Text style={styles.text}>{text.noDevices}</Text>
        ) : null}

        {model.sources.map(source => (
          <View
            key={source.fingerprint}
            style={styles.publisher}
          >
            <Text style={styles.heading}>{source.label}</Text>

            <Text selectable style={styles.secondary}>
              {source.fingerprint}
            </Text>

            <ActionButton
              label={`${text.openFrom} ${source.label}`}
              disabled={model.busy}
              onPress={() => model.open(source.fingerprint)}
            />
          </View>
        ))}

        {model.source ? (
          <View style={styles.group}>
            <Text style={styles.heading}>{text.source}</Text>
            <Text style={styles.text}>{model.source.label}</Text>
            <Text selectable style={styles.secondary}>
              {model.source.fingerprint}
            </Text>

            {model.schedule ? (
              <ReceivedScheduleView schedule={model.schedule} />
            ) : (
              <Text style={styles.text}>{text.noCopy}</Text>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
