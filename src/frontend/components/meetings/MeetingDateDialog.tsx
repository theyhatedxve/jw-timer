import { useState } from 'react';
import { Modal, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../../../constants/theme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';

import { useAppTheme } from '../../context/AppearanceContext';
import AppButton from '../common/AppButton';
import AppScreen from '../common/AppScreen';

export default function MeetingDateDialog({
  initialDate,
  selectDate,
  close,
}: {
  readonly initialDate: string;
  readonly selectDate: (date: string) => boolean;
  readonly close: () => void;
}) {
  const [value, setValue] = useState(initialDate);
  const [invalid, setInvalid] = useState(false);
  const { palette } = useAppTheme();
  const insets = useSafeAreaInsets();

  function apply(): void {
    if (!selectDate(value)) {
      setInvalid(true);
      return;
    }

    close();
  }

  return (
    <Modal visible animationType="none" onRequestClose={close}>
      <View
        className="flex-1 bg-app-canvas"
        style={{ paddingTop: insets.top + spacing.small }}
      >
        <AppScreen>
          <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
            {text.dateTitle}
          </Text>

          <Text className="text-app-body text-app-secondary">
            {text.dateHelp}
          </Text>

          <Text className="text-app-body text-app-text">
            {text.dateLabel}
          </Text>

          <TextInput
            autoFocus
            accessibilityLabel={text.dateLabel}
            value={value}
            onChangeText={next => {
              setValue(next);
              setInvalid(false);
            }}
            placeholder={text.datePlaceholder}
            placeholderTextColor={palette.secondary}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            returnKeyType="done"
            onSubmitEditing={apply}
            className="min-h-app-touch rounded-app-button border border-app-border bg-app-surface p-app-medium text-app-body text-app-text"
          />

          {invalid ? (
            <Text
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              className="text-app-body text-app-danger"
            >
              {text.invalidDate}
            </Text>
          ) : null}

          <AppButton label={text.applyDate} onPress={apply} />
          <AppButton label={text.cancel} onPress={close} />
        </AppScreen>
      </View>
    </Modal>
  );
}
