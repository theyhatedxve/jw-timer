import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { timerEn as text } from '../../../constants/strings/timerEn';
import { fullscreenPresentation as fullscreenTheme, timerPresentation } from '../../../constants/timerTheme';
import { timerPresentationEn as presentation } from '../../../constants/strings/timerPresentationEn';

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
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const completed = model.timer.status === 'completed';
  const [expanded, setExpanded] = useState(false);
  const selectionLocked = model.locked || model.timer.status === 'running';

  useEffect(() => {
    if (selectionLocked) setExpanded(false);
  }, [selectionLocked]);

  useEffect(() => {
    setExpanded(false);
  }, [model.fullscreen, model.active]);

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
      label: model.fullscreen ? text.restart : presentation.restart,
      onPress: model.confirmReset,
      disabled: model.locked,
      background: model.fullscreen ? timerPresentation.restartBackground : timerPresentation.sessionRestartBackground,
      foreground: timerPresentation.restartText,
    },
  ];

  const timerList = (
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
            <Text className="text-app-body" style={{ color: selected ? (model.fullscreen ? fullscreenTheme.muted : palette.brand) : (model.fullscreen ? fullscreenTheme.text : palette.text) }}>
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
          <Text className="text-app-body font-semibold text-app-text" style={model.fullscreen ? { color: fullscreenTheme.text } : undefined}>{text.finish}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );

  if (model.fullscreen) {
    const programButton = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={presentation.viewProgram + '. ' + model.partTitle}
        accessibilityState={{ expanded: expanded && !selectionLocked, disabled: selectionLocked }}
        disabled={selectionLocked}
        onPress={() => setExpanded(true)}
        className="min-h-app-touch flex-row items-center gap-app-small rounded-app-card px-app-medium py-app-small active:opacity-75 disabled:opacity-50"
        style={{ backgroundColor: fullscreenTheme.panel, flex: landscape ? 1 : undefined, minHeight: landscape ? undefined : fullscreenTheme.portraitProgramHeight }}
      >
        <AppIcon name="list" color={fullscreenTheme.muted} size={20} />
        <View className="flex-1 gap-1">
          <Text className="text-sm font-bold" style={{ color: fullscreenTheme.text }}>
            {landscape ? presentation.program.toUpperCase() : presentation.viewProgram}
          </Text>
          {!landscape ? <Text className="text-xs" style={{ color: fullscreenTheme.muted }}>{presentation.chooseAnotherPart}</Text> : null}
        </View>
        {!landscape ? <AppIcon name="chevronRight" color={fullscreenTheme.muted} size={18} /> : null}
      </Pressable>
    );

    return (
      <View className="gap-app-small" style={landscape ? { width: '80%', alignSelf: 'flex-end' } : undefined}>
        <View className="flex-row items-stretch gap-app-small">
          {actions.map(action => (
            <Pressable
              key={action.key}
              accessibilityRole="button"
              accessibilityState={{ disabled: action.disabled }}
              disabled={action.disabled}
              onPress={action.onPress}
              className="min-h-app-touch flex-1 flex-row items-center justify-center gap-app-small rounded-app-card px-app-medium py-app-small active:opacity-75 disabled:opacity-50"
              style={{ backgroundColor: action.key === 'running' ? fullscreenTheme.start : fullscreenTheme.restart, minHeight: landscape ? undefined : fullscreenTheme.portraitControlHeight }}
            >
              <AppIcon name={action.icon} color={fullscreenTheme.text} size={18} />
              <Text className="flex-shrink text-center text-sm font-bold" style={{ color: fullscreenTheme.text }}>
                {landscape ? action.label.toUpperCase() : action.label}
              </Text>
            </Pressable>
          ))}
          {landscape ? programButton : null}
          {landscape ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={text.exitFullscreen}
              onPress={model.toggleFullscreen}
              className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button active:opacity-75"
              style={{ backgroundColor: fullscreenTheme.panel }}
            >
              <AppIcon name="close" color={fullscreenTheme.text} size={20} />
            </Pressable>
          ) : null}
        </View>
        {!landscape ? programButton : null}
        <Modal
          visible={expanded && !selectionLocked && model.active}
          animationType="fade"
          transparent
          supportedOrientations={['portrait', 'landscape']}
          onRequestClose={() => setExpanded(false)}
        >
          <SafeAreaView className="flex-1 justify-center p-app-medium" style={{ backgroundColor: fullscreenTheme.background }}>
            <View accessibilityViewIsModal className="w-full max-w-app-content self-center gap-app-small" style={{ flexShrink: 1 }}>
              <View className="flex-row items-center gap-app-small">
                <Text accessibilityRole="header" className="flex-1 text-app-body font-bold" style={{ color: fullscreenTheme.text }}>{presentation.viewProgram}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setExpanded(false)}
                  className="min-h-app-touch items-center justify-center px-app-medium"
                >
                  <Text className="text-app-body" style={{ color: fullscreenTheme.muted }}>{text.cancel}</Text>
                </Pressable>
              </View>
              {timerList}
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    );
  }

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
              className="min-h-app-touch flex-row items-center justify-center gap-app-small rounded-app-card p-app-medium active:opacity-75 disabled:opacity-50"
              style={{
                backgroundColor: action.background,
                minHeight: timerPresentation.sessionControlHeight,
              }}
            >
              <AppIcon name={action.icon} color={action.foreground} size={24} />
              <Text
                className="flex-shrink text-center text-app-body font-bold"
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
          className="min-h-app-touch flex-row items-center gap-app-small px-app-medium py-app-small disabled:opacity-50"
        >
          <AppIcon name="list" color={palette.brand} size={18} />
          <Text className="flex-1 text-sm font-semibold text-app-text">{text.chooseTimer}</Text>
          <Text accessible={false} className="text-app-body text-app-secondary">{expanded ? '⌃' : '⌄'}</Text>
        </Pressable>
        {expanded && !selectionLocked ? (
          timerList
        ) : null}
      </View>
    </View>
  );
}
