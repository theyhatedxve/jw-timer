import { Switch, Text, View } from 'react-native';

import { useAppTheme } from '../../context/AppearanceContext';

interface Props {
  readonly label: string;
  readonly hint?: string;
  readonly value: boolean;
  readonly disabled?: boolean;
  readonly onValueChange: (value: boolean) => void;
}

export default function AppToggleRow({
  label,
  hint,
  value,
  disabled = false,
  onValueChange,
}: Props) {
  const { palette } = useAppTheme();

  return (
    <View className="min-h-app-touch flex-row items-center gap-app-medium">
      <View className="flex-1 gap-app-small">
        <Text className="text-app-body font-semibold text-app-text">
          {label}
        </Text>
        {hint ? (
          <Text className="text-app-body text-app-secondary">
            {hint}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: palette.border, true: palette.brand }}
        thumbColor={palette.surface}
      />
    </View>
  );
}
