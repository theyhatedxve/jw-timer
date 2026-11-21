import { StyleSheet } from 'react-native';
import { colors } from '../../../constants/theme';

export const styles = StyleSheet.create({
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
