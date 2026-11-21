import { StyleSheet } from 'react-native';
import { colors, dimensions, spacing, typography } from '../../../constants/theme';

export const styles = StyleSheet.create({
  button: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    borderRadius: dimensions.buttonRadius,
    backgroundColor: colors.brand,
  },
  label: {
    color: colors.onBrand,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabled: {
    backgroundColor: colors.disabled,
  },
  pressed: {
    backgroundColor: colors.secondary,
  },
});
