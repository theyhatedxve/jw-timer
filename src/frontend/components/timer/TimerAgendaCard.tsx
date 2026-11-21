import { Pressable, Text, View } from 'react-native';

import { sectionColors } from '../../../constants/meetingProgramTheme';
import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentationEn } from '../../../constants/strings/timerPresentationEn';

import { useAppTheme } from '../../context/AppearanceContext';
import type { TimerAgendaRow } from '../../hooks/useTimerAgenda';

export default function TimerAgendaCard({
  row,
  disabled,
  onMenu,
}: {
  readonly row: TimerAgendaRow;
  readonly disabled: boolean;
  readonly onMenu: (index: number) => void;
}) {
  const { palette, resolved } = useAppTheme();
  const section = sectionColors(row.sectionTitle, resolved, palette);

  return (
    <View className="gap-app-small pb-app-medium">
      {row.startsSection ? (
        <View
          className="rounded-app-button border p-app-small"
          style={{
            backgroundColor: section.background,
            borderColor: section.border,
          }}
        >
          <Text
            accessibilityRole="header"
            className="text-app-body font-bold"
            style={{ color: section.text }}
          >
            {row.sectionTitle}
          </Text>
        </View>
      ) : null}

      <View
        className="gap-app-small rounded-app-card border p-app-medium"
        style={{
          backgroundColor: row.current
            ? palette.selection
            : palette.surface,
          borderColor: row.current ? palette.brand : palette.border,
        }}
      >
        <Text className="text-app-body font-semibold text-app-text">
          {row.title}
        </Text>

        {row.current ? (
          <Text className="text-app-body text-app-secondary">
            {text.selectedPart}
          </Text>
        ) : null}

        <View className="flex-row flex-wrap items-center gap-app-small">
          <View className="min-w-app-stat flex-1">
            <Text className="text-app-body text-app-secondary">
              {text.duration}
            </Text>
            <Text className="text-app-body text-app-text">
              {row.durationLabel}
            </Text>
          </View>

          <View className="min-w-app-stat flex-1">
            <Text className="text-app-body text-app-secondary">
              {text.timer}
            </Text>
            <Text
              accessibilityLiveRegion="none"
              className="text-app-body text-app-text"
            >
              {row.timerLabel}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${text.partMenu}: ${row.title}`}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onMenu(row.index)}
            className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75 disabled:opacity-50"
          >
            <Text accessible={false} className="text-app-title text-app-text">
              {timerPresentationEn.menuSymbol}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
