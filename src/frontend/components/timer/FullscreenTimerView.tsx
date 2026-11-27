import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';

import { fullscreenPresentation as theme } from '../../../constants/timerTheme';
import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentationEn as presentation } from '../../../constants/strings/timerPresentationEn';
import { spacing } from '../../../constants/theme';
import type { useTimerSession } from '../../hooks/useTimerSession';
import { useFullscreenTimer } from '../../context/FullscreenTimerContext';
import { fullscreenColors, timerProgressPercent } from '../../utils/timerPresentation';
import AppIcon from '../common/AppIcon';
import FullscreenTimerFace, { FullscreenTimerStatus } from './FullscreenTimerFace';
import TimerControls from './TimerControls';
import TimerSessionMessages from './TimerSessionMessages';

type Model = ReturnType<typeof useTimerSession>;

export default function FullscreenTimerView({
  model, durationLabel,
}: {
  readonly model: Model;
  readonly durationLabel: string;
}) {
  const { width, height } = useWindowDimensions();
  const { preferences } = useFullscreenTimer();
  const colors = fullscreenColors(preferences);
  const landscape = width > height;
  const meetingTitle = model.program.meetingType
    ? presentation.fullscreenMeetingTypes[model.program.meetingType]
    : model.program.title;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {landscape ? (
        <View
          accessible={false} pointerEvents="none"
          style={{ position: 'absolute', left: spacing.small, top: spacing.medium, bottom: spacing.medium, width: theme.railWidth, borderRadius: theme.railWidth, backgroundColor: model.overtime ? colors.overtime : theme.accent }}
        />
      ) : null}
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1, minHeight: landscape ? theme.landscapeMinHeight : theme.portraitMinHeight,
          paddingVertical: spacing.medium, paddingHorizontal: spacing.large, gap: spacing.medium,
        }}
      >
        {!landscape ? (
          <View className="flex-row flex-wrap items-center justify-between gap-app-small">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.exitFullscreen}
              onPress={model.toggleFullscreen}
              className="min-h-app-touch flex-row items-center gap-app-small active:opacity-75"
            >
              <AppIcon name="chevronLeft" color={colors.muted} size={20} />
              <Text className="text-xs font-semibold" style={{ color: colors.muted }}>{text.exitFullscreen.toUpperCase()}</Text>
            </Pressable>
            <FullscreenTimerStatus stateLabel={model.stateLabel} status={model.timer.status} overtime={model.overtime} />
          </View>
        ) : null}

        <TimerSessionMessages model={model} />
        {!model.ready && !model.error ? <ActivityIndicator color={colors.muted} /> : null}
        {model.ready && !model.pendingRecovery ? (
          <FullscreenTimerFace
            preferences={preferences}
            digits={model.digits}
            stateLabel={model.stateLabel}
            durationLabel={durationLabel}
            partTitle={model.partTitle}
            progress={timerProgressPercent(model.timer, model.nowMs)}
            overtime={model.overtime}
            fontSize={model.displaySize}
            meetingTitle={meetingTitle}
            status={model.timer.status}
            layout={landscape ? 'landscape' : 'portrait'}
          />
        ) : <View style={{ flex: 1 }} />}
        <TimerControls model={model} />
        {!landscape && (model.timer.status === 'paused' || model.timer.status === 'ready') ? (
          <Text className="text-center text-xs" style={{ color: colors.muted }}>
            {model.timer.status === 'paused' ? presentation.fullscreenPausedHint : presentation.fullscreenReadyHint}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
