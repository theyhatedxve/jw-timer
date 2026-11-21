import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../../constants/theme';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: spacing.large, gap: spacing.medium },
  title: { color: colors.text, fontSize: typography.title, fontWeight: '700' },
  text: { color: colors.secondary, fontSize: typography.body, lineHeight: typography.bodyLineHeight },
});
