import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { workbookImportEn as importText } from '../../../constants/strings/workbookImportEn';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';

import type { useMeetings } from '../../hooks/useMeetings';
import { useAppTheme } from '../../context/AppearanceContext';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppScreen from '../common/AppScreen';
import MeetingWeekPicker from './MeetingWeekPicker';
import MeetingAgenda from './MeetingAgenda';
import AddMeetingTimer from './AddMeetingTimer';

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
    <View className="flex-1 bg-app-canvas">
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

        {model.online.busy ? (
          <AppButton label={importText.cancelDownload} onPress={model.online.cancel} />
        ) : null}
        {model.online.message ? (
          <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
            {model.online.message}
          </Text>
        ) : null}
        {model.online.error ? (
          <Text accessibilityRole="alert" className="text-app-body text-app-danger">
            {model.online.error}
          </Text>
        ) : null}

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
              {saved.draft.importSource?.retrievedAt ? (
                <Text className="text-sm text-app-secondary">
                  {importText.wolCached(saved.draft.importSource.retrievedAt)}
                </Text>
              ) : null}
            </View>

            <Text className="text-sm text-app-secondary">{text.editPartHint}</Text>
            <MeetingAgenda
              key={saved.id + ':' + saved.revision}
              sections={saved.draft.sections}
              save={(section, part, value) => model.changePart(saved, section, part, value)}
              remove={(section, part) => model.changePart(saved, section, part, null)}
            />
            <AddMeetingTimer
              key={saved.id}
              save={(title, minutes) => model.addTimer(saved, title, minutes)}
            />
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

      </AppScreen>
      <View className="w-full max-w-app-content self-center flex-row gap-app-small px-app-large py-app-small">
        {[
          {
            key: 'wol',
            label: model.online.busy ? importText.importingShort : importText.wolShort,
            accessibilityLabel: importText.wolImport[model.meetingType],
            disabled: !model.online.ready || model.online.busy,
            onPress: model.online.run,
          },
          {
            key: 'pdf',
            label: importText.localPdfShort,
            accessibilityLabel: text.importPdf,
            disabled: model.online.busy,
            onPress: model.importPdf,
          },
        ].map(action => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            accessibilityState={{ disabled: action.disabled }}
            disabled={action.disabled}
            onPress={action.onPress}
            className="min-h-app-touch flex-1 items-center justify-center rounded-app-button border border-app-border bg-app-surface px-app-small py-2 active:opacity-75 disabled:opacity-50"
          >
            <Text className="text-center text-sm font-semibold text-app-text">{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
