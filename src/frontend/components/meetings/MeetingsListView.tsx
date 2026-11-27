import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { workbookImportEn as importText } from '../../../constants/strings/workbookImportEn';
import { meetingProgramsEn as text } from '../../../constants/strings/meetingProgramsEn';
import { spacing } from '../../../constants/theme';
import type { useMeetings } from '../../hooks/useMeetings';
import { useAppTheme } from '../../context/AppearanceContext';
import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppIcon from '../common/AppIcon';
import AppScreen from '../common/AppScreen';
import MeetingWeekPicker from './MeetingWeekPicker';
import MeetingAgenda from './MeetingAgenda';
import MeetingActionsDialog from './MeetingActionsDialog';

type Props = ReturnType<typeof useMeetings>;
const types = ['midweek', 'weekend'] as const;

export default function MeetingsListView(model: Props) {
  const { palette } = useAppTheme();
  const [actionsOpen, setActionsOpen] = useState(false);
  const saved = model.state.status === 'ready' ? model.state.meeting : null;
  const matches = model.state.status === 'ready' ? model.state.matches : [];
  const parts = saved ? saved.draft.sections.flatMap(section => section.parts) : [];
  const timedParts = parts.filter(part => part.isTimed);
  const seconds = timedParts.reduce((total, part) => total + part.durationSeconds, 0);
  const canOpenTimer = timedParts.some(part => part.durationSeconds > 0);
  const sources = { pdf: 0, wol: 0, local: 0 };
  const choices = matches.map(meeting => {
    const source = meeting.importSource
      ? meeting.importSource.parser === 'wol-v1' ? 'wol' : 'pdf'
      : 'local';
    sources[source] += 1;
    const label = text.programSources[source] + (sources[source] > 1 ? ' ' + sources[source] : '');
    return { meeting, label };
  });
  const sourceCount = Object.values(sources).filter(count => count > 0).length;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-app-canvas">
      <AppScreen>
        <View className="flex-row items-center gap-app-medium">
          <View className="flex-1 gap-app-small">
            <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">{text.screenTitle}</Text>
            <Text className="text-sm text-app-secondary">{text.subtitle}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.addOrImport}
            accessibilityState={{ disabled: model.online.busy }}
            disabled={model.online.busy}
            onPress={() => setActionsOpen(true)}
            className="min-h-app-touch min-w-app-touch items-center justify-center rounded-full border border-app-border bg-app-surface active:opacity-75 disabled:opacity-50"
          >
            <AppIcon name="plus" color={palette.brand} size={spacing.large} />
          </Pressable>
        </View>

        <View accessibilityRole="tablist" className="flex-row rounded-app-card border border-app-border bg-app-surface p-1">
          {types.map(type => {
            const selected = model.meetingType === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => model.selectType(type)}
                className={'min-h-app-touch flex-1 items-center justify-center rounded-app-card px-app-small py-app-small active:opacity-75 ' + (selected ? 'bg-app-brand' : 'bg-app-surface')}
              >
                <Text className={'text-center text-app-body font-bold ' + (selected ? 'text-app-onBrand' : 'text-app-secondary')}>{text.types[type]}</Text>
              </Pressable>
            );
          })}
        </View>

        <MeetingWeekPicker
          week={model.week} canPrevious={model.canPrevious} canNext={model.canNext}
          previousWeek={model.previousWeek} nextWeek={model.nextWeek}
          selectDate={model.selectDate}
        />

        {model.online.busy ? <AppButton label={importText.cancelDownload} onPress={model.online.cancel} /> : null}
        {model.online.message ? <Text accessibilityLiveRegion="polite" className="text-sm text-app-secondary">{model.online.message}</Text> : null}
        {model.online.error ? <Text accessibilityRole="alert" className="text-app-body text-app-danger">{model.online.error}</Text> : null}

        {model.state.status === 'loading' ? (
          <View className="gap-app-small">
            <ActivityIndicator color={palette.brand} />
            <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">{text.loading}</Text>
          </View>
        ) : model.state.status === 'error' ? (
          <AppCard>
            <Text accessibilityRole="alert" className="text-app-body text-app-danger">{model.state.message}</Text>
            <AppButton label={text.retry} onPress={model.reload} />
          </AppCard>
        ) : !saved ? (
          <AppCard><Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">{text.empty}</Text></AppCard>
        ) : (
          <>
            <View className="gap-app-small">
              <View className="flex-row flex-wrap items-center justify-between gap-app-small">
                <Text accessibilityRole="header" className="text-xl font-bold text-app-text">{text.chooseProgram}</Text>
                <View className="rounded-full px-app-medium py-app-small" style={{ backgroundColor: palette.selection }}>
                  <Text className="text-xs font-semibold text-app-secondary">{text.sourcesCount(sourceCount)}</Text>
                </View>
              </View>
              <View className="flex-row flex-wrap gap-app-small">
                {choices.map(({ meeting, label }) => {
                  const selected = meeting.id === saved.id;
                  return (
                    <Pressable
                      key={meeting.id}
                      accessibilityRole="button"
                      accessibilityLabel={label + '. ' + text.date(meeting.meetingDate) + '. ' + meeting.title}
                      accessibilityState={{ selected }}
                      onPress={() => model.selectMeeting(meeting.id)}
                      className={'min-h-app-touch items-center justify-center rounded-app-card border border-app-border px-app-medium py-app-small active:opacity-75 ' + (selected ? 'bg-app-brand' : 'bg-app-surface')}
                      style={{ flexBasis: '28%', flexGrow: 1 }}
                    >
                      <Text className={'text-center text-app-body font-bold ' + (selected ? 'text-app-onBrand' : 'text-app-secondary')}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View className="gap-app-small">
              <Text accessibilityRole="header" className="text-2xl font-bold text-app-text">{text.programTitle[model.meetingType]}</Text>
              <Text className="text-sm text-app-secondary">{text.timedSummary(timedParts.length, seconds)}</Text>
            </View>
            <MeetingAgenda
              key={saved.id + ':' + saved.revision}
              sections={saved.draft.sections}
              save={(section, part, value) => model.changePart(saved, section, part, value)}
              remove={(section, part) => model.changePart(saved, section, part, null)}
            />
            {!canOpenTimer ? <Text className="text-sm text-app-secondary">{text.noTimedParts}</Text> : null}
          </>
        )}
      </AppScreen>

      {saved ? (
        <View className="w-full max-w-app-content self-center px-app-large py-app-small">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={text.timer}
            accessibilityState={{ disabled: !canOpenTimer }}
            disabled={!canOpenTimer}
            onPress={() => model.openTimer(saved.id)}
            className="min-h-app-touch flex-row items-center justify-center gap-app-small rounded-app-card bg-app-brand p-app-medium active:opacity-75 disabled:opacity-50"
          >
            <AppIcon name="play" color={palette.onBrand} size={spacing.medium} />
            <Text className="text-center text-app-body font-bold text-app-onBrand">{text.timer}</Text>
          </Pressable>
        </View>
      ) : null}
      {actionsOpen ? (
        <MeetingActionsDialog key={saved?.id ?? model.meetingType} model={model} meeting={saved} close={() => setActionsOpen(false)} />
      ) : null}
    </SafeAreaView>
  );
}
