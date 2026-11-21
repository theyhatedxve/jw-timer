import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';

import type { useMeetings } from '../../hooks/useMeetings';
import { useAppTheme } from '../../context/AppearanceContext';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppScreen from '../common/AppScreen';
import MeetingDateDialog from './MeetingDateDialog';
import ProgramSectionCard from './ProgramSectionCard';

type Props = ReturnType<typeof useMeetings>;

const types = ['midweek', 'weekend'] as const;

export default function MeetingsListView(model: Props) {
  const [dateDialog, setDateDialog] = useState(false);
  const { palette } = useAppTheme();

  const saved = model.state.status === 'ready'
    ? model.state.meeting
    : null;

  const matches = model.state.status === 'ready'
    ? model.state.matches
    : [];

  const parts = saved
    ? saved.draft.sections.flatMap(section => section.parts)
    : [];

  const seconds = parts.reduce(
    (total, part) => total + (part.isTimed ? part.durationSeconds : 0),
    0,
  );

  const canOpenTimer = parts.some(part =>
    part.isTimed && part.durationSeconds > 0,
  );

  return (
    <>
      <AppScreen>
        <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
          {text.title}
        </Text>

        <View className="flex-row gap-app-small">
          {types.map(type => {
            const selected = model.meetingType === type;

            return (
              <Pressable
                key={type}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => model.selectType(type)}
                className={
                  'min-h-app-touch flex-1 items-center justify-center rounded-app-button border border-app-border p-app-medium active:opacity-75 ' +
                  (selected ? 'bg-app-brand' : 'bg-app-surface')
                }
              >
                <Text
                  className={
                    'text-center text-app-body font-bold ' +
                    (selected ? 'text-app-onBrand' : 'text-app-text')
                  }
                >
                  {text.types[type]}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
            className="min-h-app-touch flex-1 items-center justify-center rounded-app-button bg-app-surface p-app-small active:opacity-75"
          >
            <Text
              accessibilityLiveRegion="polite"
              className="text-center text-app-body font-semibold text-app-text"
            >
              {model.week ? text.week(model.week) : text.chooseDate}
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

        <AppButton label={text.create} onPress={model.createMeeting} />

        {model.state.status === 'loading' ? (
          <View className="gap-app-medium">
            <ActivityIndicator color={palette.brand} />
            <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
              {text.loading}
            </Text>
          </View>
        ) : model.state.status === 'error' ? (
          <AppCard>
            <Text accessibilityRole="alert" className="text-app-body text-app-danger">
              {model.state.message}
            </Text>
            <AppButton label={text.retry} onPress={model.reload} />
          </AppCard>
        ) : !saved ? (
          <AppCard>
            <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
              {text.empty}
            </Text>
          </AppCard>
        ) : (
          <>
            {matches.length > 1 ? (
              <AppCard>
                <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
                  {text.chooseProgram}
                </Text>

                {matches.map(meeting => (
                  <AppButton
                    key={meeting.id}
                    label={
                      `${text.date(meeting.meetingDate)} · ${meeting.title}` +
                      (meeting.id === saved.id ? text.selected : '')
                    }
                    selected={meeting.id === saved.id}
                    onPress={() => model.selectMeeting(meeting.id)}
                  />
                ))}
              </AppCard>
            ) : null}

            <AppCard>
              <Text className="text-app-body text-app-secondary">
                {text.local}
                {' · '}
                {text.date(saved.draft.meetingDate)}
              </Text>

              <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
                {saved.draft.title}
              </Text>

              <Text className="text-app-body text-app-secondary">
                {text.summary(parts.length, seconds)}
              </Text>

              <AppButton
                label={text.edit}
                onPress={() => model.openMeeting(saved.id)}
              />

              <AppButton
                label={text.timer}
                disabled={!canOpenTimer}
                onPress={() => model.openTimer(saved.id)}
              />

              {!canOpenTimer ? (
                <Text className="text-app-body text-app-secondary">
                  {text.noTimedParts}
                </Text>
              ) : null}
            </AppCard>

            {saved.draft.sections.map((section, index) => (
              <ProgramSectionCard
                key={`${saved.id}:${saved.revision}:${section.id ?? index}`}
                section={section}
              />
            ))}
          </>
        )}
      </AppScreen>

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
