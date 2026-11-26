import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Temporal } from '@js-temporal/polyfill';

import { dimensions } from '../../../constants/theme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { isCalendarDate } from '../../../backend/domain/meetings/meetingValidation';
import { calendarMonthDays, shiftCalendarMonth } from '../../utils/meetingCalendar';

import { useAppTheme } from '../../context/AppearanceContext';
import AppButton from '../common/AppButton';

export default function MeetingDateDialog({
  initialDate,
  selectDate,
  close,
}: {
  readonly initialDate: string;
  readonly selectDate: (date: string) => boolean;
  readonly close: () => void;
}) {
  const [value, setValue] = useState(() => isCalendarDate(initialDate)
    ? initialDate : Temporal.Now.plainDateISO().toString());
  const [month, setMonth] = useState(() =>
    Temporal.PlainDate.from(value).with({ day: 1 }).toString());
  const [invalid, setInvalid] = useState(false);
  const { palette } = useAppTheme();
  const cells = calendarMonthDays(month);
  const previous = shiftCalendarMonth(month, -1);
  const next = shiftCalendarMonth(month, 1);
  const monthLabel = new Intl.DateTimeFormat('en', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(month + 'T12:00:00Z'));
  const dayFormatter = new Intl.DateTimeFormat('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });
  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7));

  function apply(): void {
    if (!selectDate(value)) {
      setInvalid(true);
      return;
    }
    close();
  }

  return (
    <Modal
      visible transparent animationType="fade"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={close}
    >
      <SafeAreaView
        className="flex-1 justify-center p-app-small"
        style={{ backgroundColor: palette.canvas + 'CC' }}
      >
        <ScrollView
          style={{ maxWidth: dimensions.contentWidth, width: '100%', alignSelf: 'center', flexGrow: 0 }}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            accessibilityViewIsModal
            className="gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium"
          >
            <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
              {text.dateTitle}
            </Text>
            <Text className="text-app-body text-app-secondary">{text.dateHelp}</Text>
            <View className="flex-row items-center gap-app-small">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.previousMonth}
                accessibilityState={{ disabled: previous === null }}
                disabled={previous === null}
                onPress={() => { if (previous) setMonth(previous); }}
                className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75 disabled:opacity-50"
              >
                <Text accessible={false} className="text-app-title text-app-text">{text.previousSymbol}</Text>
              </Pressable>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="flex-1 text-center text-app-body font-bold text-app-text">
                {monthLabel}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={text.nextMonth}
                accessibilityState={{ disabled: next === null }}
                disabled={next === null}
                onPress={() => { if (next) setMonth(next); }}
                className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75 disabled:opacity-50"
              >
                <Text accessible={false} className="text-app-title text-app-text">{text.nextSymbol}</Text>
              </Pressable>
            </View>
            <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
              <View style={{ flex: 1, minWidth: dimensions.minimumTouchTarget * 7 }}>
                <View className="flex-row">
                  {text.weekdays.map(day => (
                    <Text key={day} className="flex-1 text-center text-sm text-app-secondary">{day}</Text>
                  ))}
                </View>
                {weeks.map((week, index) => (
                  <View key={index} className="flex-row">
                    {week.map((date, column) => date ? (
                      <Pressable
                        key={date}
                        accessibilityRole="button"
                        accessibilityLabel={dayFormatter.format(new Date(date + 'T12:00:00Z'))}
                        accessibilityState={{ selected: date === value }}
                        onPress={() => { setValue(date); setInvalid(false); }}
                        className="min-h-app-touch flex-1 items-center justify-center rounded-app-button active:opacity-75"
                        style={date === value ? { backgroundColor: palette.brand } : undefined}
                      >
                        <Text className="text-app-body" style={{ color: date === value ? palette.onBrand : palette.text }}>
                          {Number(date.slice(8))}
                        </Text>
                      </Pressable>
                    ) : <View key={'blank-' + column} className="min-h-app-touch flex-1" />)}
                  </View>
                ))}
              </View>
            </ScrollView>
            <Text accessibilityLiveRegion="polite" className="text-center text-app-body text-app-text">
              {text.date(value)}
            </Text>
            {invalid ? (
              <Text accessibilityRole="alert" className="text-app-body text-app-danger">{text.invalidDate}</Text>
            ) : null}
            <AppButton label={text.applyDate} onPress={apply} />
            <AppButton label={text.cancel} onPress={close} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
