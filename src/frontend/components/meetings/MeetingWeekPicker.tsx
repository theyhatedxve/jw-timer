import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { spacing } from '../../../constants/theme';
import { useAppTheme } from '../../context/AppearanceContext';
import AppIcon from '../common/AppIcon';
import MeetingDateDialog from './MeetingDateDialog';

interface Props {
  readonly week: string | null;
  readonly canPrevious: boolean;
  readonly canNext: boolean;
  readonly previousWeek: () => void;
  readonly nextWeek: () => void;
  readonly selectDate: (date: string) => boolean;
}

export default function MeetingWeekPicker(model: Props) {
  const [dateDialog, setDateDialog] = useState(false);
  const { palette } = useAppTheme();

  return (
    <>
      <View className="flex-row items-center gap-app-small">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.previous}
          accessibilityState={{ disabled: !model.canPrevious }}
          disabled={!model.canPrevious}
          onPress={model.previousWeek}
          className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button bg-app-surface active:opacity-75 disabled:opacity-50"
        >
          <Text accessible={false} className="text-app-title text-app-text">
            {text.previousSymbol}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityHint={text.chooseDate}
          onPress={() => setDateDialog(true)}
          className="min-h-app-touch flex-1 flex-row items-center justify-center gap-app-small rounded-app-button bg-app-surface p-app-small active:opacity-75"
        >
          <AppIcon name="meetings" color={palette.text} size={spacing.medium} />
          <Text
            accessibilityLiveRegion="polite"
            className="flex-shrink text-center text-app-body font-semibold text-app-text"
          >
            {model.week ? text.week(model.week) : text.chooseDate}
          </Text>
          <Text accessible={false} className="text-app-body text-app-secondary">
            {text.collapseSymbol}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.next}
          accessibilityState={{ disabled: !model.canNext }}
          disabled={!model.canNext}
          onPress={model.nextWeek}
          className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button bg-app-surface active:opacity-75 disabled:opacity-50"
        >
          <Text accessible={false} className="text-app-title text-app-text">
            {text.nextSymbol}
          </Text>
        </Pressable>
      </View>

      {dateDialog ? (
        <MeetingDateDialog
          initialDate={model.week ?? ''}
          selectDate={model.selectDate}
          close={() => setDateDialog(false)}
        />
      ) : null}
    </>
  );
}
