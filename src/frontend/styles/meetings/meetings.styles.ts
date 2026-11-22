import { StyleSheet } from 'react-native';
import { colors as legacyColors, dimensions, spacing, typography } from '../../../constants/theme';
import type { AppPalette } from '../../../constants/appearanceTheme';

export function createMeetingStyles(
  colors: Pick<AppPalette, keyof typeof legacyColors>,
) {
  return StyleSheet.create({
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
    paddingBottom: spacing.large * 2,
  },
  group: {
    gap: spacing.small,
  },
  card: {
    padding: spacing.medium,
    gap: spacing.medium,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.cardRadius,
  },
  part: {
    paddingTop: spacing.medium,
    gap: spacing.medium,
    borderTopWidth: dimensions.borderWidth,
    borderTopColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  supporting: {
    color: colors.secondary,
    fontSize: typography.supporting,
    lineHeight: typography.bodyLineHeight,
  },
  input: {
    minHeight: dimensions.minimumTouchTarget,
    padding: spacing.medium,
    color: colors.text,
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
    fontSize: typography.body,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  choice: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
  },
  selectedChoice: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  selectedLabel: {
    color: colors.onBrand,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  });
}

export const meetingStyles = createMeetingStyles(legacyColors);
