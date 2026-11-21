import { styles } from '../../styles/common/actionButton.styles';
import { Pressable, Text } from 'react-native';



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

