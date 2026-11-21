import { StyleSheet } from 'react-native';

import {
  dimensions,
  spacing,
  typography,
} from '../../../constants/theme';

export const publisherColors = {
  background: '#FFFFFF',
  text: '#14202B',
  secondary: '#52606D',
  border: '#D5DDE5',
  badge: '#E6F3FA',
  badgeText: '#14567C',
  error: '#A32020',
} as const;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: publisherColors.background,
  },
  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    padding: spacing.medium,
    gap: spacing.medium,
    paddingBottom: spacing.large,
  },
  group: {
    gap: spacing.small,
  },
  title: {
    color: publisherColors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  heading: {
    color: publisherColors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  text: {
    color: publisherColors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  secondary: {
    color: publisherColors.secondary,
    fontSize: typography.supporting,
    lineHeight: typography.bodyLineHeight,
  },
  input: {
    minHeight: dimensions.minimumTouchTarget,
    borderWidth: dimensions.borderWidth,
    borderColor: publisherColors.border,
    borderRadius: dimensions.buttonRadius,
    padding: spacing.medium,
    color: publisherColors.text,
    backgroundColor: publisherColors.background,
    fontSize: typography.body,
  },
  publisher: {
    gap: spacing.medium,
    paddingVertical: spacing.medium,
    borderBottomWidth: dimensions.borderWidth,
    borderBottomColor: publisherColors.border,
  },
  wideRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flexible: {
    flex: 1,
    minWidth: 0,
    gap: spacing.small,
  },
  roles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  badge: {
    color: publisherColors.badgeText,
    backgroundColor: publisherColors.badge,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
    borderRadius: dimensions.buttonRadius,
    fontSize: typography.supporting,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    minHeight: dimensions.minimumTouchTarget,
    paddingVertical: spacing.small,
  },
  roleGroup: {
    borderTopWidth: dimensions.borderWidth,
    borderTopColor: publisherColors.border,
    paddingTop: spacing.medium,
    gap: spacing.small,
  },
  error: {
    color: publisherColors.error,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
});