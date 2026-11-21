import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import {
  colors,
  dimensions,
  spacing,
  typography,
} from '../../constants/theme';

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

export const meetingStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    width: '100%',
    maxWidth: dimensions.contentWidth,
    alignSelf: 'center',
    padding: spacing.large,
    gap: spacing.medium,
    paddingBottom: spacing.large * 2,
  },
  group: {
    gap: spacing.small,
  },
  card: {
    padding: spacing.medium,
    gap: spacing.medium,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.cardRadius,
  },
  part: {
    paddingTop: spacing.medium,
    gap: spacing.medium,
    borderTopWidth: dimensions.borderWidth,
    borderTopColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  body: {
    color: colors.text,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  supporting: {
    color: colors.secondary,
    fontSize: typography.supporting,
    lineHeight: typography.bodyLineHeight,
  },
  input: {
    minHeight: dimensions.minimumTouchTarget,
    padding: spacing.medium,
    color: colors.text,
    backgroundColor: colors.canvas,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
    fontSize: typography.body,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  choice: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.buttonRadius,
  },
  selectedChoice: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  selectedLabel: {
    color: colors.onBrand,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  error: {
    color: colors.danger,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
});