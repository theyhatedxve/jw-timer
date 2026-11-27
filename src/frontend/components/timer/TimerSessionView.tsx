import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentation } from '../../../constants/timerTheme';
import { formatCompactMeetingWeek } from '../../../constants/strings/programFormatting';
import { meetingWeek } from '../../../backend/domain/meetings/meetingWeek';
import { timerPresentationEn as presentation } from '../../../constants/strings/timerPresentationEn';

import { useAppTheme } from '../../context/AppearanceContext';
import { useFullscreenTimer } from '../../context/FullscreenTimerContext';
import { fullscreenColors } from './FullscreenTimerFace';
import { useTimerAgenda } from '../../hooks/useTimerAgenda';
import type { useTimerSession } from '../../hooks/useTimerSession';
import { styles } from '../../styles/timer/timerPresentation.styles';

import AppButton from '../common/AppButton';
import AppCard from '../common/AppCard';
import AppIcon from '../common/AppIcon';
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
  const { preferences } = useFullscreenTimer();
  const fullscreenPalette = fullscreenColors(preferences, palette);
  const [showAgenda, setShowAgenda] = useState(false);
  const agenda = useTimerAgenda(model);

  const presenting = model.fullscreen && model.active;
  const showCountdown = model.ready && !model.pendingRecovery;

  useEffect(() => {
    if (!model.active || model.fullscreen) setShowAgenda(false);
  }, [model.active, model.fullscreen]);

  const statusBackground = model.timer.status === 'paused'
    ? palette.warningBackground
    : model.overtime && model.timer.status === 'running' ? palette.danger + '22' : palette.selection;
  const statusColor = model.timer.status === 'paused'
    ? palette.warning
    : model.overtime && model.timer.status === 'running' ? palette.danger : palette.brand;
  const caption = model.program.meetingType && model.program.meetingDate
    ? presentation.meetingTypes[model.program.meetingType] + ' · ' +
      formatCompactMeetingWeek(meetingWeek(model.program.meetingDate))
    : model.program.title;

  const current = agenda.rows[model.timer.partIndex];
  const next = model.timer.status === 'completed'
    ? undefined
    : agenda.rows[model.timer.partIndex + 1];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: model.fullscreen ? fullscreenPalette.background : palette.canvas }]}
    >
      {model.active ? (
        <StatusBar
          style={resolved === 'dark' ? 'light' : 'dark'}
          hidden={presenting}
        />
      ) : null}

      {presenting && model.keepAwake ? <AwakeWhilePresented /> : null}

      {model.fullscreen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.exitFullscreen}
          onPress={model.toggleFullscreen}
          className="min-h-app-touch min-w-app-touch items-center justify-center self-end rounded-app-button active:opacity-75"
        >
          <AppIcon name="exitFullscreen" color={fullscreenPalette.digits} size={20} />
        </Pressable>
      ) : null}

      <ScrollView
        key={model.fullscreen ? 'fullscreen' : 'session'}
        className="flex-1"
        contentContainerStyle={[
          styles.content,
          model.fullscreen ? styles.fullscreenContent : styles.sessionContent,
        ]}
      >
          <View className="gap-app-medium pb-app-medium">
            {!model.fullscreen ? (
              <View className="gap-app-small">
                <View className="flex-row flex-wrap items-center gap-app-small">
                  <Text accessibilityRole="header" className="flex-1 text-app-title font-bold text-app-text">{presentation.screenTitle}</Text>
                  <View className="rounded-full px-app-medium py-app-small" style={{ backgroundColor: statusBackground }}>
                    <Text className="text-xs font-bold" style={{ color: statusColor }}>{model.stateLabel.toUpperCase()}</Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={presentation.showAgenda}
                    accessibilityState={{ disabled: !showCountdown }}
                    disabled={!showCountdown}
                    onPress={() => setShowAgenda(true)}
                    className="min-h-app-touch min-w-app-touch items-center justify-center rounded-full border border-app-border bg-app-surface active:opacity-75 disabled:opacity-50"
                  >
                    <AppIcon name="list" color={palette.brand} size={20} />
                  </Pressable>
                </View>
                <Text className="text-app-body text-app-secondary">{caption}</Text>
              </View>
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

            {!model.fullscreen && showCountdown && next ? (
              <View className="gap-app-small">
                <Text className="text-xs font-bold text-app-secondary">{presentation.upNext}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={text.chooseTimer + '. ' + next.title}
                  accessibilityState={{ disabled: model.locked || model.timer.status === 'running' }}
                  disabled={model.locked || model.timer.status === 'running'}
                  onPress={() => model.selectPart(model.timer.partIndex + 1)}
                  className="min-h-app-touch flex-row items-center gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium active:opacity-75 disabled:opacity-50"
                >
                  <View className="rounded-full p-app-small" style={{ backgroundColor: palette.selection }}>
                    <AppIcon name="list" color={palette.brand} size={24} />
                  </View>
                  <View className="flex-1 gap-app-small">
                    <Text className="text-xl font-bold text-app-text">{next.title}</Text>
                    <Text className="text-sm text-app-secondary">
                      {next.durationLabel}{' · '}
                      {(model.timer.partElapsedMs?.[model.timer.partIndex + 1] ?? 0) > 0
                        ? presentation.savedPart : presentation.nextReady}
                    </Text>
                  </View>
                  <Text accessible={false} className="text-app-title text-app-secondary">{presentation.nextSymbol}</Text>
                </Pressable>
              </View>
            ) : null}

            {!model.fullscreen ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={presentation.enterFullscreen}
                accessibilityState={{ disabled: model.locked }}
                disabled={model.locked}
                onPress={model.toggleFullscreen}
                className="min-h-app-touch flex-row items-center justify-center gap-app-small rounded-app-card p-app-medium active:opacity-75 disabled:opacity-50"
                style={{ backgroundColor: timerPresentation.sessionBackground }}
              >
                <AppIcon name="fullscreen" color={timerPresentation.sessionText} size={22} />
                <Text className="flex-shrink text-center text-app-body font-bold" style={{ color: timerPresentation.sessionText }}>{presentation.enterFullscreen}</Text>
              </Pressable>
            ) : null}

            {!model.fullscreen ? (
              <>
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
                  <Text className="text-app-body text-app-secondary">
                    {text.currentTime}
                    {' · '}
                    {agenda.timezone}
                  </Text>
                  <Text accessibilityLiveRegion="none" className="text-app-body font-bold text-app-text">
                    {agenda.clock}
                  </Text>
                </AppCard>

                <AppCard>
                  <Text accessibilityLiveRegion="none" className="text-app-body text-app-text">
                    {text.estimatedFinish}: {agenda.estimatedFinish}
                  </Text>
                  <Text className="text-app-body text-app-secondary">
                    {agenda.estimateNote}
                  </Text>
                </AppCard>

                <Text className="text-app-body text-app-secondary">
                  {text.snapshotNote}
                </Text>

                {model.program.meetingId && !model.program.meetingDate ? (
                  <Text className="text-app-body text-app-secondary">
                    {text.legacyMetadata}
                  </Text>
                ) : null}


              </>
            ) : null}
          </View>
      </ScrollView>
      <Modal
        visible={showAgenda && model.active && !model.fullscreen && showCountdown}
        animationType="slide"
        presentationStyle="pageSheet"
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={() => setShowAgenda(false)}
      >
        <SafeAreaView
          accessibilityViewIsModal
          style={[styles.safe, { backgroundColor: palette.canvas }]}
        >
          <FlatList
            data={agenda.rows}
            keyExtractor={row => row.id}
            extraData={model.locked || model.timer.status === 'running'}
            contentContainerStyle={styles.content}
            ListHeaderComponent={
              <View className="gap-app-small pb-app-medium">
                <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
                  {presentation.showAgenda}
                </Text>
                <Text className="text-app-body text-app-secondary">{model.program.title}</Text>
                <AppButton
                  label={text.resetAll}
                  disabled={model.locked || model.timer.status === 'running'}
                  onPress={model.confirmResetAll}
                />
                <AppButton label={presentation.closeAgenda} onPress={() => setShowAgenda(false)} />
              </View>
            }
            renderItem={({ item }) => (
              <TimerAgendaCard
                row={item}
                disabled={model.locked || model.timer.status === 'running'}
                onMenu={model.openPartMenu}
              />
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
