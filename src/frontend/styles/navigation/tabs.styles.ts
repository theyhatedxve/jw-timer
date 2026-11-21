import { StyleSheet } from 'react-native';
import { colors, dimensions, spacing, typography } from '../../../constants/theme';

export const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderColor: colors.border, borderTopWidth: dimensions.borderWidth },
  item: { minHeight: dimensions.minimumTouchTarget, paddingHorizontal: spacing.small, paddingVertical: spacing.small },
  label: { fontSize: typography.supporting, lineHeight: typography.navigationLineHeight, textAlign: 'center', flexShrink: 1 },
  hiddenIcon: { display: 'none' },
});
