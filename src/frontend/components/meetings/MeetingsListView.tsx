import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { workbookParsingEn } from '../../../constants/strings/workbookParsingEn';
import { spacing } from '../../../constants/theme';

import type { useMeetings } from '../../hooks/useMeetings';
import { useAppTheme } from '../../context/AppearanceContext';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppIcon from '../common/AppIcon';
import AppScreen from '../common/AppScreen';
import MeetingWeekPicker from './MeetingWeekPicker';
import ProgramSectionCard from './ProgramSectionCard';

type Props = ReturnType<typeof useMeetings>;

const types = ['midweek', 'weekend'] as const;

export default function MeetingsListView(model: Props) {
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
        <View
          accessibilityRole="tablist"
          className="flex-row rounded-full border border-app-border bg-app-surface"
        >
          {types.map(type => {
            const selected = model.meetingType === type;

            return (
              <Pressable
                key={type}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => model.selectType(type)}
                className={
                  'min-h-app-touch flex-1 items-center justify-center rounded-full px-app-small py-app-small active:opacity-75 ' +
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

        <MeetingWeekPicker
          week={model.week}
          canPrevious={model.canPrevious}
          canNext={model.canNext}
          previousWeek={model.previousWeek}
          nextWeek={model.nextWeek}
          selectDate={model.selectDate}
        />

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

            <View className="gap-app-small">
              <Text accessibilityRole="header" className="text-xl font-bold text-app-text">
                {saved.draft.title}
              </Text>
              <Text className="text-app-body text-app-secondary">
                {text.summary(parts.length, seconds)}
              </Text>
            </View>

            <View className="gap-app-small">
              {saved.draft.sections.map((section, index) => {
                const key = `${saved.id}:${saved.revision}:${section.id ?? index}`;
                const showOpeningRows =
                  section.title === workbookParsingEn.openingSection &&
                  section.parts.length > 0 &&
                  section.parts.every(part => part.kind === 'song' || part.kind === 'comments');

                if (!showOpeningRows) {
                  return <ProgramSectionCard key={key} section={section} />;
                }

                return (
                  <View key={key} className="gap-app-small">
                    {section.parts.map((part, partIndex) => (
                      <View
                        key={part.id ?? partIndex}
                        className="min-h-app-touch flex-row items-center gap-app-small rounded-app-button border border-app-border bg-app-surface p-app-small"
                      >
                        <AppIcon
                          name={part.kind === 'song' ? 'song' : 'comments'}
                          color={palette.text}
                          size={spacing.large}
                        />
                        <Text className="flex-1 text-app-body font-semibold text-app-text">
                          {part.title}
                        </Text>
                        <Text className="text-app-body text-app-secondary">
                          {part.isTimed ? text.duration(part.durationSeconds) : text.untimed}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>

            <AppButton label={text.edit} onPress={() => model.openMeeting(saved.id)} />
            <AppButton
              label={text.timer}
              disabled={!canOpenTimer}
              onPress={() => model.openTimer(saved.id)}
            />
            {!canOpenTimer ? (
              <Text className="text-app-body text-app-secondary">{text.noTimedParts}</Text>
            ) : null}
          </>
        )}

        <AppButton label={text.importPdf} onPress={model.importPdf} />
      </AppScreen>


    </>
  );
}
