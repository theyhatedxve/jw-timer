import { Fragment, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { MeetingPartDraft, MeetingSectionDraft } from '../../../backend/domain/meetings/meeting.types';
import { sectionColors, sectionTone } from '../../../constants/meetingProgramTheme';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { useAppTheme } from '../../context/AppearanceContext';

import MeetingPartEditor from './MeetingPartEditor';

const timeColumn = 'w-[68px] text-right tabular-nums';

export default function MeetingAgenda({
  sections,
  save,
  remove,
}: {
  readonly sections: readonly MeetingSectionDraft[];
  readonly save: (sectionIndex: number, partIndex: number, part: MeetingPartDraft) => string | null;
  readonly remove: (sectionIndex: number, partIndex: number) => string | null;
}) {
  const { palette, resolved } = useAppTheme();
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <View className="overflow-hidden rounded-app-card border border-app-border bg-app-surface">
      <View className="flex-row items-center gap-app-small bg-app-canvas px-app-small py-2">
        <Text accessibilityRole="header" className="flex-1 text-xs font-semibold text-app-secondary">
          {text.agendaTitle}
        </Text>
        <Text accessibilityRole="header" className={timeColumn + ' text-xs font-semibold text-app-secondary'}>
          {text.agendaDuration}
        </Text>
        <Text accessibilityRole="header" className={timeColumn + ' text-xs font-semibold text-app-secondary'}>
          {text.agendaTimer}
        </Text>
      </View>

      {sections.flatMap((section, sectionIndex) => {
        const colors = sectionColors(section.title, resolved, palette);
        const tone = sectionTone(section.title);

        return section.parts.map((part, index) => {
          const duration = part.isTimed ? text.clock(part.durationSeconds) : text.untimed;
          const timer = part.isTimed ? duration : '—';
          const showSectionColor = tone !== 'neutral' && part.kind !== 'song' && part.kind !== 'comments';

          const key = part.id ?? sectionIndex + ':' + index;
          return (
            <Fragment key={key}>
            <Pressable
              accessibilityRole="button"
              accessibilityHint={text.editPartHint}
              accessibilityLabel={text.agendaRow(part.title, duration, timer)}
              onPress={() => setEditing(current => current === key ? null : key)}
              className="min-h-app-touch flex-row items-center gap-app-small border-t border-app-border px-app-small py-1.5"
              style={showSectionColor ? { backgroundColor: colors.background } : undefined}
            >
              <Text className="flex-1 text-sm" style={{ color: showSectionColor ? colors.text : palette.text }}>
                {part.title}
              </Text>
              <Text className={timeColumn + ' text-sm text-app-text'}>{duration}</Text>
              <Text className={timeColumn + ' text-sm text-app-text'}>{timer}</Text>
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
        });
      })}
    </View>
  );
}
