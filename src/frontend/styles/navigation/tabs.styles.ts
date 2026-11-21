import { StyleSheet } from 'react-native';

import {
  colors,
  dimensions,
  spacing,
  typography,
} from '../../../constants/theme';

export const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: dimensions.borderWidth,
  },
  item: {
    minHeight: dimensions.minimumTouchTarget,
    paddingHorizontal: spacing.small,
    paddingVertical: spacing.small,
    borderRadius: dimensions.cardRadius,
  },
  label: {
    fontSize: typography.supporting,
    lineHeight: typography.navigationLineHeight,
    textAlign: 'center',
    flexShrink: 1,
  },
  hiddenIcon: {
    display: 'none',
  },
  settingsButton: {
    minWidth: dimensions.minimumTouchTarget,
    minHeight: dimensions.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
    borderRadius: dimensions.buttonRadius,
  },
  settingsGlyph: {
    color: colors.text,
    fontSize: typography.title,
  },
  settingsPressed: {
    backgroundColor: colors.surface,
  },
});