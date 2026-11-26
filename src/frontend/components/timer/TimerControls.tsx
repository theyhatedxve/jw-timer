import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

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
  const [expanded, setExpanded] = useState(false);
  const selectionLocked = model.locked || model.timer.status === 'running';

  useEffect(() => {
    if (selectionLocked) setExpanded(false);
  }, [selectionLocked]);

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
      <View className="overflow-hidden rounded-app-button border border-app-border bg-app-surface">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={text.chooseTimer + '. ' + model.partTitle}
          accessibilityState={{ expanded: expanded && !selectionLocked, disabled: selectionLocked }}
          disabled={selectionLocked}
          onPress={() => setExpanded(value => !value)}
          className="min-h-app-touch flex-row items-center gap-app-small p-app-medium disabled:opacity-50"
        >
          <View className="flex-1 gap-1">
            <Text className="text-sm text-app-secondary">{text.chooseTimer}</Text>
            <Text className="text-app-body font-semibold text-app-text">{model.partTitle}</Text>
          </View>
          <Text accessible={false} className="text-app-body text-app-secondary">{expanded ? '⌃' : '⌄'}</Text>
        </Pressable>
        {expanded && !selectionLocked ? (
          <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {model.program.parts.map((part, index) => {
              const selected = index === model.timer.partIndex;
              return (
                <Pressable
                  key={part.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected, disabled: selected && !completed }}
                  disabled={selected && !completed}
                  onPress={() => {
                    setExpanded(false);
                    model.selectPart(index);
                  }}
                  className="min-h-app-touch border-t border-app-border p-app-medium active:opacity-75"
                >
                  <Text className="text-app-body" style={{ color: selected ? palette.brand : palette.text }}>
                    {part.title}
                  </Text>
                </Pressable>
              );
            })}
            {model.isLastPart && !completed ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setExpanded(false);
                  model.advancePart();
                }}
                className="min-h-app-touch border-t border-app-border p-app-medium active:opacity-75"
              >
                <Text className="text-app-body font-semibold text-app-text">{text.finish}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
