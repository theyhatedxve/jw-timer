import { ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../common/AppButton';
import { useDocumentStyles } from '../../styles/common/useDocumentStyles';
import { lanProbeEn as text } from '../../../constants/strings/lanProbeEn';
import type { useLanProbe } from '../../hooks/useLanProbe';
import ReceivedScheduleView from './ReceivedScheduleView';
import CodeExchange from './CodeExchange';
import LanDiscovery from './LanDiscovery';

export default function LanProbeView(model: ReturnType<typeof useLanProbe>) {
  const styles = useDocumentStyles();
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.text}>{text.instructions}</Text>
        <Text style={styles.secondary}>{text.scope}</Text>
        <ActionButton label={text.prepare} disabled={model.busy || model.hosting} onPress={model.prepare} />
        <Text style={styles.heading}>{text.code}</Text>
        <Text selectable style={styles.text}>{model.code}</Text>
        <CodeExchange value={model.code} maxLength={512} disabled={model.busy} />
        <ActionButton label={text.start} disabled={model.busy || model.hosting} onPress={model.start} />
        <ActionButton label={text.stop} disabled={model.busy || !model.hosting} onPress={model.stop} />
        {model.hosting ? <Text accessibilityLiveRegion="polite" style={styles.text}>{text.hosting}</Text> : null}
        <Text style={styles.heading}>{text.incoming}</Text>
        <TextInput
          accessibilityLabel={text.incoming}
          value={model.incoming}
          onChangeText={model.setIncoming}
          editable={!model.busy && !model.hosting}
          multiline
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={512}
          style={styles.input}
        />
        <CodeExchange onChange={model.setIncoming} maxLength={512} disabled={model.busy || model.hosting} />
        <LanDiscovery fingerprint={model.fingerprint} onChange={model.setIncoming} disabled={model.busy || model.hosting} />
        <ActionButton
          label={text.connect}
          disabled={model.busy || model.hosting || !model.incoming}
          onPress={model.connect}
        />
        <ActionButton
          label={text.download}
          disabled={model.busy || model.hosting || !model.incoming}
          onPress={model.download}
        />
        <ActionButton
          label={text.loadReceived}
          disabled={model.busy || model.hosting}
          onPress={model.loadReceived}
        />
        {model.preview ? <ReceivedScheduleView schedule={model.preview} /> : null}
        <ActionButton
          label={text.saveReceived}
          disabled={model.busy || model.hosting || !model.canSave}
          onPress={model.saveReceived}
        />
        <ActionButton label={text.protocol} disabled={model.busy} onPress={model.checkProtocol} />
        {model.message ? <Text accessibilityRole="alert" style={styles.text}>{model.message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
