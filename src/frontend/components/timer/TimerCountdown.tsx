import { Text, View } from 'react-native';

import { timerPresentation } from '../../../constants/timerTheme';
import { timerPresentationEn as text } from '../../../constants/strings/timerPresentationEn';
import type { useTimerSession } from '../../hooks/useTimerSession';
import { timerProgressPercent } from '../../utils/timerPresentation';
import { styles } from '../../styles/timer/timerPresentation.styles';
import FullscreenTimerFace from './FullscreenTimerFace';
import { useFullscreenTimer } from '../../context/FullscreenTimerContext';

type Model = ReturnType<typeof useTimerSession>;

export default function TimerCountdown({
  model, durationLabel,
}: {
  readonly model: Model;
  readonly durationLabel: string;
}) {
  const { preferences } = useFullscreenTimer();
  const percent = timerProgressPercent(model.timer, model.nowMs);
  const progressWidth: `${number}%` = `${percent}%`;

  if (model.fullscreen) {
    return (
      <FullscreenTimerFace
        preferences={preferences}
        digits={model.digits}
        stateLabel={model.stateLabel}
        durationLabel={durationLabel}
        partTitle={model.partTitle}
        progress={percent}
        overtime={model.overtime}
        fontSize={model.displaySize}
      />
    );
  }

  const digitColor = model.overtime
    ? timerPresentation.sessionOvertime
    : timerPresentation.sessionText;
  return (
    <View
      className="gap-app-large p-app-large"
      style={{ backgroundColor: timerPresentation.sessionBackground, borderRadius: timerPresentation.sessionRadius }}
    >
      <View className="gap-app-small">
        <Text className="text-center text-xs font-bold" style={{ color: timerPresentation.sessionMuted }}>{text.current.toUpperCase()}</Text>
        <Text accessibilityRole="header" className="text-center text-xl font-bold" style={{ color: timerPresentation.sessionText }}>
          {model.partTitle}
        </Text>
      </View>
      <Text
        accessibilityLabel={model.stateLabel + ': ' + model.digits}
        accessibilityLiveRegion="none"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={timerPresentation.minimumDigitScale}
        style={[styles.digits, { fontSize: model.displaySize, color: digitColor }]}
      >
        {model.digits}
      </Text>
      <Text className="text-center text-app-body" style={{ color: timerPresentation.sessionMuted }}>{text.allotted(durationLabel)}</Text>
      <View className="gap-app-small">
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={text.progress}
          accessibilityLiveRegion="none"
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          style={[styles.progressTrack, { backgroundColor: timerPresentation.sessionTrack }]}
        >
          <View style={[
            styles.progressFill,
            {
              width: progressWidth,
              minWidth: timerPresentation.progressHeight,
              backgroundColor: model.overtime ? timerPresentation.sessionOvertime : timerPresentation.sessionMuted,
            },
          ]} />
        </View>
        <Text className="text-center text-sm" style={{ color: timerPresentation.sessionMuted }}>
          {model.overtime ? text.overtime : text.remaining}{' · '}{model.stateLabel}
        </Text>
      </View>
    </View>
  );
}
