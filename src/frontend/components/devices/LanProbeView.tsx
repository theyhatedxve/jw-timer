import { ScrollView, Text, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ActionButton from '../common/ActionButton';
import { styles } from '../../styles/publishers/publishers.styles';
import { lanProbeEn as text } from '../../../constants/strings/lanProbeEn';
import type { useLanProbe } from '../../hooks/useLanProbe';

export default function LanProbeView(model: ReturnType<typeof useLanProbe>) {
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.text}>{text.instructions}</Text>
        <Text style={styles.secondary}>{text.scope}</Text>
        <ActionButton label={text.prepare} disabled={model.busy || model.hosting} onPress={model.prepare} />
        <Text style={styles.heading}>{text.code}</Text>
        <Text selectable style={styles.text}>{model.code}</Text>
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
        <ActionButton
          label={text.connect}
          disabled={model.busy || model.hosting || !model.incoming}
          onPress={model.connect}
        />
        <ActionButton label={text.protocol} disabled={model.busy} onPress={model.checkProtocol} />
        {model.message ? <Text accessibilityRole="alert" style={styles.text}>{model.message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
