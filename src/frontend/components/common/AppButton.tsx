import { Pressable, Text } from 'react-native';

interface Props {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
  readonly selected?: boolean;
}

export default function AppButton({
  label,
  onPress,
  disabled = false,
  selected = false,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      className={
        'min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button bg-app-brand p-app-medium active:opacity-75 disabled:opacity-50 ' +
        (selected
          ? 'border-2 border-app-text'
          : 'border border-app-border')
      }
    >
      <Text className="text-center text-app-body font-bold text-app-onBrand">
        {label}
      </Text>
    </Pressable>
  );
}
