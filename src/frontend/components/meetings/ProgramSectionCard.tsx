import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { MeetingSectionDraft } from '../../../backend/domain/meetings/meeting.types';

import { sectionColors } from '../../../constants/meetingProgramTheme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { useAppTheme } from '../../context/AppearanceContext';

export default function ProgramSectionCard({
  section,
}: {
  readonly section: MeetingSectionDraft;
}) {
  const [expanded, setExpanded] = useState(false);
  const { resolved, palette } = useAppTheme();

  const colors = sectionColors(section.title, resolved, palette);

  const seconds = section.parts.reduce(
    (total, part) => total + (part.isTimed ? part.durationSeconds : 0),
    0,
  );

  return (
    <View
      className="overflow-hidden rounded-app-card border"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={section.title}
        accessibilityHint={expanded ? text.collapse : text.expand}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(current => !current)}
        className="min-h-app-touch flex-row items-center gap-app-medium p-app-medium active:opacity-75"
      >
        <View className="flex-1 gap-app-small">
          <Text
            className="text-app-body font-bold"
            style={{ color: colors.text }}
          >
            {section.title}
          </Text>

          <Text className="text-app-body" style={{ color: colors.text }}>
            {text.summary(section.parts.length, seconds)}
          </Text>
        </View>

        <Text
          accessible={false}
          className="text-app-title"
          style={{ color: colors.text }}
        >
          {expanded ? text.collapseSymbol : text.expandSymbol}
        </Text>
      </Pressable>

      {expanded ? (
        <View className="gap-app-medium p-app-medium">
          {section.parts.length === 0 ? (
            <Text className="text-app-body" style={{ color: colors.text }}>
              {text.noParts}
            </Text>
          ) : section.parts.map((part, index) => (
            <View
              key={part.id ?? String(index)}
              className="flex-row flex-wrap items-start justify-between gap-app-small"
            >
              <Text
                className="min-w-app-stat flex-1 text-app-body"
                style={{ color: colors.text }}
              >
                {part.title}
              </Text>

              <Text className="text-app-body" style={{ color: colors.text }}>
                {part.isTimed
                  ? text.duration(part.durationSeconds)
                  : text.untimed}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
