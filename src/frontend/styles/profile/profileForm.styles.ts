import { StyleSheet } from 'react-native';
import { colors, dimensions, spacing, typography } from '../../../constants/theme';

export const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: dimensions.contentWidth,
    alignSelf: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  body: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  input: {
    minHeight: dimensions.minimumTouchTarget,
    padding: spacing.medium,
    color: colors.text,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
    fontSize: typography.body,
  },
  option: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
  },
  selectedOption: {
    borderColor: colors.brand,
    backgroundColor: colors.surface,
  },
});
