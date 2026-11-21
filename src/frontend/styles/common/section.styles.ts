import { StyleSheet } from 'react-native';
import { colors, dimensions, spacing, typography } from '../../../constants/theme';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: dimensions.contentWidth,
    alignSelf: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  appName: {
    color: colors.brand,
    fontSize: typography.supporting,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  description: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  card: {
    padding: spacing.medium,
    gap: spacing.medium,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.cardRadius,
  },
  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  body: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  button: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: colors.brand,
    borderRadius: dimensions.buttonRadius,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.onBrand,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
