import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {
  colors,
  dimensions,
  spacing,
  typography,
} from '../../constants/theme';

interface ActionButtonProps {
  readonly label: string;
  readonly disabled?: boolean;
  readonly onPress: () => void;
}

export default function ActionButton({
  label,
  disabled = false,
  onPress,
}: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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