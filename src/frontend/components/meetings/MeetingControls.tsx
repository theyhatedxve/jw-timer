import { meetingStyles } from '../../styles/meetings/meetings.styles';
import { Pressable, Text, TextInput, View, type TextInputProps } from 'react-native';



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
    <View style={meetingStyles.group}>
      <Text style={meetingStyles.label}>{label}</Text>

      {hint ? (
        <Text style={meetingStyles.supporting}>{hint}</Text>
      ) : null}

      <TextInput
        accessibilityLabel={label}
        accessibilityHint={hint}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={meetingStyles.input}
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
    <View style={meetingStyles.group}>
      <Text style={meetingStyles.label}>{label}</Text>

      <View style={meetingStyles.actions}>
        {options.map(option => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityLabel={`${label}: ${option.label}`}
              accessibilityState={{
                selected,
                disabled,
              }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={[
                meetingStyles.choice,
                selected && meetingStyles.selectedChoice,
                disabled && meetingStyles.disabled,
              ]}
            >
              <Text
                style={[
                  meetingStyles.body,
                  selected && meetingStyles.selectedLabel,
                ]}
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

