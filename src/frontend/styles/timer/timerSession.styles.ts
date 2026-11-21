import { StyleSheet } from 'react-native';
import { colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
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
