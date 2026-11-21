import { Text, View } from 'react-native';
import { CameraView } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import { useIsFocused } from '@react-navigation/native';
import ActionButton from '../common/ActionButton';
import { useCodeExchange } from '../../hooks/useCodeExchange';
import { codeExchangeEn as text } from '../../../constants/strings/codeExchangeEn';
import { styles } from '../../styles/devices/codeExchange.styles';
import { styles as common, publisherColors } from '../../styles/publishers/publishers.styles';

export interface CodeExchangeProps {
  readonly value?: string;
  readonly onChange?: (value: string) => void;
  readonly maxLength?: number;
  readonly disabled?: boolean;
}
function isBoundedQr(value: string | undefined, maxLength: number): value is string {
  if (!value || value.length > maxLength) return false;
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0) ?? 0;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
    if (bytes > 2048) return false;
  }
  return true;
}
export default function CodeExchange({ value, onChange, maxLength = 2048, disabled = false }: CodeExchangeProps) {
  const model = useCodeExchange(onChange, maxLength, disabled);
  const focused = useIsFocused();
  const canDisplay = isBoundedQr(value, maxLength);
  return <View style={styles.group}>
    {canDisplay ? <ActionButton label={model.showQr ? text.hide : text.show} disabled={disabled} onPress={model.toggleQr} /> : null}
    {canDisplay && model.showQr && focused ? <View accessible accessibilityLabel={text.show} style={styles.qr}>
      <QRCode value={value} size={240} quietZone={8} color={publisherColors.text} backgroundColor={publisherColors.background} ecl="L" />
    </View> : null}
    {onChange ? <><Text style={common.secondary}>{text.instruction}</Text>
      <ActionButton label={text.scan} disabled={disabled || model.scanning} onPress={model.scan} />
    </> : null}
    {model.scanning && !disabled && focused ? <>
      <CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => model.receive(data)} onMountError={model.cameraFailed} />
      <ActionButton label={text.close} onPress={model.close} />
    </> : null}
    {model.error ? <Text accessibilityRole="alert" style={common.error}>{model.error}</Text> : null}
  </View>;
}
