import { Pressable, Text, View, type TextInputProps } from 'react-native';

import AppInput from '../common/AppInput';

interface MeetingFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly editable?: boolean;
  readonly keyboardType?: TextInputProps['keyboardType'];
  readonly hint?: string;
}

export function MeetingField({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = 'default',
  hint,
}: MeetingFieldProps) {
  return (
    <View className="gap-app-small">
      <Text className="text-app-body font-semibold text-app-text">
        {label}
      </Text>
      {hint ? (
        <Text className="text-app-body text-app-secondary">{hint}</Text>
      ) : null}
      <AppInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

interface MeetingChoicesProps<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly options: readonly {
    readonly value: T;
    readonly label: string;
  }[];
  readonly onChange: (value: T) => void;
  readonly disabled?: boolean;
}

export function MeetingChoices<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: MeetingChoicesProps<T>) {
  return (
    <View className="gap-app-small">
      <Text className="text-app-body font-semibold text-app-text">
        {label}
      </Text>
      <View className="flex-row flex-wrap gap-app-small">
        {options.map(option => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              className={
                'min-h-app-touch justify-center rounded-app-button border p-app-medium active:opacity-75 disabled:opacity-50 ' +
                (selected
                  ? 'border-app-brand bg-app-brand'
                  : 'border-app-border bg-app-surface')
              }
            >
              <Text
                className={
                  'text-app-body font-semibold ' +
                  (selected ? 'text-app-onBrand' : 'text-app-text')
                }
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
