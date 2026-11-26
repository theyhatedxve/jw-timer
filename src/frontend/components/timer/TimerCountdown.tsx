import { Text, View } from 'react-native';

import { sectionColors } from '../../../constants/meetingProgramTheme';
import { timerPresentation } from '../../../constants/timerTheme';
import { timerEn } from '../../../constants/strings/timerEn';
import { timerPresentationEn as text } from '../../../constants/strings/timerPresentationEn';

import { useAppTheme } from '../../context/AppearanceContext';
import type { useTimerSession } from '../../hooks/useTimerSession';
import { timerProgressPercent } from '../../utils/timerPresentation';
import { styles } from '../../styles/timer/timerPresentation.styles';
import AppIcon from '../common/AppIcon';

type Model = ReturnType<typeof useTimerSession>;

export default function TimerCountdown({
  model,
  durationLabel,
}: {
  readonly model: Model;
  readonly durationLabel: string;
}) {
  const { palette, resolved } = useAppTheme();

  const part = model.program.parts[model.timer.partIndex];
  const sectionTitle = part?.sectionTitle ?? timerEn.agenda;
  const section = sectionColors(sectionTitle, resolved, palette);

  const percent = timerProgressPercent(model.timer, model.nowMs);
  const progressWidth: `${number}%` = `${percent}%`;

  const running = model.timer.status === 'running';
  const paused = model.timer.status === 'paused';
  const completed = model.timer.status === 'completed';

  const badgeBackground = paused
    ? palette.warningBackground
    : running && !model.overtime
      ? timerPresentation.runningBackground
      : palette.surface;

  const badgeText = model.overtime && !completed
    ? palette.danger
    : paused
      ? palette.warning
      : running
        ? timerPresentation.runningText
        : palette.text;

  return (
    <View className="gap-app-medium">
      <View
        className="flex-row items-center gap-app-small self-center rounded-full border px-app-medium py-app-small"
        style={{
          backgroundColor: badgeBackground,
          borderColor: badgeText,
        }}
      >
        {running && !model.overtime ? (
          <AppIcon name="play" color={badgeText} size={16} />
        ) : null}
        <Text
          accessibilityLiveRegion="none"
          className="text-center text-app-body font-bold"
          style={{ color: badgeText }}
        >
          {model.stateLabel}
        </Text>
      </View>

      <Text
        accessibilityLabel={`${model.stateLabel}: ${model.digits}`}
        accessibilityLiveRegion="none"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={timerPresentation.minimumDigitScale}
        style={[
          styles.digits,
          {
            fontSize: model.displaySize,
            color: model.overtime ? palette.danger : palette.text,
          },
        ]}
      >
        {model.digits}
      </Text>

      <Text className="text-center text-app-body text-app-secondary">
        {text.allotted(durationLabel)}
      </Text>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={text.progress}
        accessibilityLiveRegion="none"
        accessibilityValue={{ min: 0, max: 100, now: percent }}
        style={[
          styles.progressTrack,
          { backgroundColor: palette.border },
        ]}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: progressWidth,
              backgroundColor: model.overtime
                ? palette.danger
                : palette.brand,
            },
          ]}
        />
      </View>

      <View className="flex-row items-start gap-app-small rounded-app-card border border-app-border bg-app-surface p-app-medium">
        <View
          className="rounded-app-button p-app-small"
          style={{ backgroundColor: section.background }}
        >
          <AppIcon name="book" color={section.text} size={24} />
        </View>

        <View className="flex-1 gap-app-small">
          <Text className="text-app-body text-app-secondary">
            {text.current} · {sectionTitle}
          </Text>
          <Text accessibilityRole="header" className="text-app-body font-bold text-app-text">
            {model.partTitle}
          </Text>
        </View>
      </View>
    </View>
  );
}
