import { Pressable, Text, View } from 'react-native';

import { timerEn as text } from '../../../constants/strings/timerEn';
import { timerPresentation } from '../../../constants/timerTheme';

import { useAppTheme } from '../../context/AppearanceContext';
import type { useTimerSession } from '../../hooks/useTimerSession';

import AppIcon from '../common/AppIcon';

type Model = ReturnType<typeof useTimerSession>;

export default function TimerControls({
  model,
}: {
  readonly model: Model;
}) {
  const { palette } = useAppTheme();
  const completed = model.timer.status === 'completed';

  const actions = [
    {
      key: 'running',
      icon: model.timer.status === 'running' ? 'pause' as const : 'play' as const,
      label: model.timer.status === 'running'
        ? text.pause
        : model.timer.status === 'paused'
          ? text.resume
          : text.start,
      onPress: model.toggleRunning,
      disabled: model.locked || completed,
      background: palette.brand,
      foreground: palette.onBrand,
    },
    {
      key: 'restart',
      icon: 'restart' as const,
      label: text.restart,
      onPress: model.confirmReset,
      disabled: model.locked,
      background: timerPresentation.restartBackground,
      foreground: timerPresentation.restartText,
    },
    {
      key: 'advance',
      icon: 'nextPart' as const,
      label: model.isLastPart ? text.finish : text.next,
      onPress: model.advancePart,
      disabled: model.locked || completed,
      background: palette.surface,
      foreground: palette.text,
    },
  ];

  return (
    <View className="gap-app-small">
      <View className="flex-row flex-wrap gap-app-small">
        {actions.map(action => (
          <View key={action.key} className="min-w-app-stat flex-1">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              className="min-h-app-touch items-center justify-center gap-app-small rounded-app-button border p-app-medium active:opacity-75 disabled:opacity-50"
              style={{
                backgroundColor: action.background,
                borderColor: palette.border,
              }}
            >
              <AppIcon name={action.icon} color={action.foreground} size={24} />
              <Text
                className="text-center text-app-body font-bold"
                style={{ color: action.foreground }}
              >
                {action.label}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}
