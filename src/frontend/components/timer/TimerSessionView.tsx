import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentationEn as presentation } from '../../../constants/strings/timerPresentationEn';

import { useAppTheme } from '../../context/AppearanceContext';
import { useTimerAgenda } from '../../hooks/useTimerAgenda';
import type { useTimerSession } from '../../hooks/useTimerSession';
import { styles } from '../../styles/timer/timerPresentation.styles';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import SettingsButton from '../common/SettingsButton';
import TimerAgendaCard from './TimerAgendaCard';
import TimerControls from './TimerControls';
import TimerCountdown from './TimerCountdown';
import TimerSessionMessages from './TimerSessionMessages';

type Model = ReturnType<typeof useTimerSession>;

function AwakeWhilePresented() {
  useKeepAwake('jw-timer-presentation', {
    suppressDeactivateWarnings: true,
  });

  return null;
}

export default function TimerSessionView(model: Model) {
  const { palette, resolved } = useAppTheme();
  const [showAgenda, setShowAgenda] = useState(false);
  const agenda = useTimerAgenda(model);

  const presenting = model.fullscreen && model.active;
  const showCountdown = model.ready && !model.pendingRecovery;

  const current = agenda.rows[model.timer.partIndex];
  const next = model.timer.status === 'completed'
    ? undefined
    : agenda.rows[model.timer.partIndex + 1];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: palette.canvas }]}
    >
      {model.active ? (
        <StatusBar
          style={resolved === 'dark' ? 'light' : 'dark'}
          hidden={presenting}
        />
      ) : null}

      {presenting && model.keepAwake ? <AwakeWhilePresented /> : null}

      <FlatList
        key={model.fullscreen ? 'fullscreen' : 'session'}
        className="flex-1"
        contentContainerStyle={[
          styles.content,
          model.fullscreen && styles.fullscreenContent,
        ]}
        data={!model.fullscreen && showAgenda ? agenda.rows : []}
        keyExtractor={row => row.id}
        extraData={model.locked}
        ListHeaderComponent={
          <View className="gap-app-medium pb-app-medium">
            {!model.fullscreen ? (
              <>
                <View className="flex-row items-start gap-app-small">
                  <View className="flex-1 gap-app-small">
                    <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
                      {model.program.title}
                    </Text>
                    <Text className="text-app-body text-app-secondary">
                      {agenda.week}
                    </Text>
                  </View>

                  <SettingsButton onPress={model.openSettings} />
                </View>

                <AppCard>
                  <Text className="text-app-body text-app-secondary">
                    {text.currentTime}
                    {' · '}
                    {agenda.timezone}
                  </Text>
                  <Text accessibilityLiveRegion="none" className="text-app-body font-bold text-app-text">
                    {agenda.clock}
                  </Text>
                </AppCard>
              </>
            ) : null}

            <TimerSessionMessages model={model} />

            {!model.ready && !model.error ? (
              <View className="gap-app-small">
                <ActivityIndicator color={palette.brand} />
                <Text accessibilityLiveRegion="polite" className="text-app-body text-app-secondary">
                  {presentation.loading}
                </Text>
              </View>
            ) : null}

            {showCountdown ? (
              <TimerCountdown
                model={model}
                durationLabel={
                  current?.durationLabel ?? presentation.durationMissing
                }
              />
            ) : null}

            <TimerControls model={model} />

            {!model.fullscreen ? (
              <>
                {showCountdown && next ? (
                  <AppCard>
                    <Text className="text-app-body text-app-secondary">
                      {presentation.next}
                    </Text>
                    <Text className="text-app-body font-bold text-app-text">
                      {next.title}
                    </Text>
                    <Text className="text-app-body text-app-secondary">
                      {next.durationLabel}
                    </Text>
                  </AppCard>
                ) : null}

                <View className="flex-row items-center gap-app-medium">
                  <Text className="flex-1 text-app-body text-app-text">
                    {text.keepAwake}
                  </Text>
                  <Switch
                    accessibilityLabel={text.keepAwake}
                    value={model.keepAwake}
                    onValueChange={model.setKeepAwake}
                    trackColor={{
                      false: palette.border,
                      true: palette.brand,
                    }}
                    thumbColor={palette.surface}
                  />
                </View>

                <AppCard>
                  <Text accessibilityLiveRegion="none" className="text-app-body text-app-text">
                    {text.estimatedFinish}: {agenda.estimatedFinish}
                  </Text>
                  <Text className="text-app-body text-app-secondary">
                    {agenda.estimateNote}
                  </Text>
                </AppCard>

                <AppButton
                  label={text.managePrograms}
                  onPress={model.openPrograms}
                />

                {model.program.meetingId ? (
                  <AppButton
                    label={text.editProgram}
                    disabled={model.locked}
                    onPress={model.editLoadedProgram}
                  />
                ) : null}

                <Text className="text-app-body text-app-secondary">
                  {text.snapshotNote}
                </Text>

                {model.program.meetingId && !model.program.meetingDate ? (
                  <Text className="text-app-body text-app-secondary">
                    {text.legacyMetadata}
                  </Text>
                ) : null}

                <AppButton
                  label={showAgenda
                    ? presentation.hideAgenda
                    : presentation.showAgenda}
                  onPress={() => setShowAgenda(currentValue => !currentValue)}
                />
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TimerAgendaCard
            row={item}
            disabled={model.locked}
            onMenu={model.openPartMenu}
          />
        )}
      />
    </SafeAreaView>
  );
}
