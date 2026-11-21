import { Text, View } from 'react-native';
import ActionButton from '../common/ActionButton';
import { useLanDiscovery } from '../../hooks/useLanDiscovery';
import { codeExchangeEn as text } from '../../../constants/strings/codeExchangeEn';
import { styles } from '../../styles/publishers/publishers.styles';

interface Props { readonly fingerprint?: string; readonly disabled?: boolean; readonly onChange: (code: string) => void }
export default function LanDiscovery({ fingerprint, disabled = false, onChange }: Props) {
  const model = useLanDiscovery(fingerprint);
  return <View style={styles.group}>
    <Text style={styles.secondary}>{text.discovered}</Text>
    <ActionButton label={model.finding ? text.stop : text.find} disabled={disabled && !model.finding} onPress={model.finding ? model.stop : model.start} />
    {model.finding ? <Text accessibilityLiveRegion="polite" style={styles.secondary}>{model.codes.length ? text.finding : text.empty}</Text> : null}
    {model.codes.map(code => <View key={code} style={styles.publisher}>
      <Text selectable style={styles.secondary}>{code}</Text>
      <ActionButton label={text.choose} disabled={disabled} onPress={() => { model.stop(); onChange(code); }} />
    </View>)}
    {model.error ? <Text accessibilityRole="alert" style={styles.error}>{model.error}</Text> : null}
  </View>;
}
