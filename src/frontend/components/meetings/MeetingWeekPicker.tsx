import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
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
  return (
    <>
      <View className="flex-row items-center gap-app-small rounded-app-card border border-app-border bg-app-surface p-app-small">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.previous}
          accessibilityState={{ disabled: !model.canPrevious }}
          disabled={!model.canPrevious}
          onPress={model.previousWeek}
          className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75 disabled:opacity-50"
        >
          <Text accessible={false} className="text-app-title text-app-secondary">{text.previousSymbol}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.chooseDate}
          accessibilityHint={model.week ? text.calendarWeek(model.week) : undefined}
          onPress={() => setDateDialog(true)}
          className="min-h-app-touch flex-1 items-center justify-center rounded-app-button py-app-small active:opacity-75"
        >
          <Text accessibilityLiveRegion="polite" className="text-center text-app-body font-bold text-app-text">
            {model.week ? text.calendarWeek(model.week) : text.chooseDate}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.next}
          accessibilityState={{ disabled: !model.canNext }}
          disabled={!model.canNext}
          onPress={model.nextWeek}
          className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75 disabled:opacity-50"
        >
          <Text accessible={false} className="text-app-title text-app-secondary">{text.nextSymbol}</Text>
        </Pressable>
      </View>
      {dateDialog ? (
        <MeetingDateDialog initialDate={model.week ?? ''} selectDate={model.selectDate} close={() => setDateDialog(false)} />
      ) : null}
    </>
  );
}
