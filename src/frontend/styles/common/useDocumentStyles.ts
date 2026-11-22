import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  dimensions,
  spacing,
  typography,
} from '../../../constants/theme';

import { useAppTheme } from '../../context/AppearanceContext';

export function useDocumentStyles() {
  const { palette } = useAppTheme();

  return useMemo(() => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.canvas,
    },
    content: {
      width: '100%',
      maxWidth: dimensions.contentWidth,
      alignSelf: 'center',
      padding: spacing.medium,
      paddingBottom: spacing.large,
      gap: spacing.medium,
    },
    group: {
      gap: spacing.small,
    },
    heading: {
      color: palette.text,
      fontSize: typography.heading,
      fontWeight: '600',
    },
    text: {
      color: palette.text,
      fontSize: typography.body,
      lineHeight: typography.bodyLineHeight,
    },
    secondary: {
      color: palette.secondary,
      fontSize: typography.supporting,
      lineHeight: typography.bodyLineHeight,
    },
    error: {
      color: palette.danger,
      fontSize: typography.body,
      lineHeight: typography.bodyLineHeight,
    },
    input: {
      minHeight: dimensions.minimumTouchTarget,
      padding: spacing.medium,
      color: palette.text,
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: dimensions.borderWidth,
      borderRadius: dimensions.buttonRadius,
      fontSize: typography.body,
    },
    publisher: {
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderWidth: dimensions.borderWidth,
      borderRadius: dimensions.cardRadius,
      padding: spacing.medium,
      gap: spacing.medium,
    },
  }), [palette]);
}
