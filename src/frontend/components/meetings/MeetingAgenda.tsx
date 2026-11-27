import { Fragment, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { MeetingPartDraft, MeetingSectionDraft } from '../../../backend/domain/meetings/meeting.types';
import { sectionColors, sectionTone } from '../../../constants/meetingProgramTheme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { useAppTheme } from '../../context/AppearanceContext';
import MeetingPartEditor from './MeetingPartEditor';

export default function MeetingAgenda({
  sections, save, remove,
}: {
  readonly sections: readonly MeetingSectionDraft[];
  readonly save: (sectionIndex: number, partIndex: number, part: MeetingPartDraft) => string | null;
  readonly remove: (sectionIndex: number, partIndex: number) => string | null;
}) {
  const { palette, resolved } = useAppTheme();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <View className="gap-app-medium">
      {sections.map((section, sectionIndex) => {
        const colors = sectionColors(section.title, resolved, palette);
        const neutral = sectionTone(section.title) === 'neutral';
        return (
          <View key={section.id ?? sectionIndex} className="gap-app-small">
            <View
              className="flex-row items-center gap-app-medium rounded-app-card p-app-medium"
              style={{ backgroundColor: neutral ? palette.selection : colors.background }}
            >
              <Text className="text-xs font-bold text-app-secondary">{String(sectionIndex + 1).padStart(2, '0')}</Text>
              <Text accessibilityRole="header" className="flex-1 text-sm font-bold" style={{ color: neutral ? palette.text : colors.text }}>
                {section.title.toUpperCase()}
              </Text>
            </View>
            {section.parts.map((part, index) => {
              const duration = part.isTimed ? text.clock(part.durationSeconds) : text.untimed;
              const key = part.id ?? sectionIndex + ':' + index;
              return (
                <Fragment key={key}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityHint={text.editPartHint}
                    accessibilityLabel={text.agendaRow(part.title, duration, duration)}
                    accessibilityState={{ expanded: editing === key }}
                    onPress={() => setEditing(current => current === key ? null : key)}
                    className="min-h-app-touch flex-row items-center gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium active:opacity-75"
                  >
                    <Text className="flex-1 text-app-body text-app-text">{part.title}</Text>
                    <Text className="text-right text-sm font-semibold tabular-nums text-app-secondary">{duration}</Text>
                  </Pressable>
                  {editing === key ? (
                    <MeetingPartEditor
                      part={part}
                      save={value => save(sectionIndex, index, value)}
                      remove={() => remove(sectionIndex, index)}
                      close={() => setEditing(null)}
                    />
                  ) : null}
                </Fragment>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
