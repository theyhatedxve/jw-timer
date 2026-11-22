import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  dimensions,
  spacing,
  typography,
} from '../../../constants/theme';

import { useAppTheme } from '../../context/AppearanceContext';

export function useAssignmentEditorStyles() {
  const { palette } = useAppTheme();

  return useMemo(() => StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: palette.canvas,
    },
    option: {
      padding: spacing.medium,
      minHeight: dimensions.minimumTouchTarget,
      borderWidth: dimensions.borderWidth,
      borderColor: palette.border,
      borderRadius: dimensions.buttonRadius,
      marginBottom: spacing.small,
      backgroundColor: palette.surface,
      gap: spacing.small,
    },
    selected: {
      backgroundColor: palette.selection,
      borderColor: palette.brand,
    },
    warning: {
      color: palette.danger,
      fontSize: typography.body,
      lineHeight: typography.bodyLineHeight,
    },
  }), [palette]);
}
