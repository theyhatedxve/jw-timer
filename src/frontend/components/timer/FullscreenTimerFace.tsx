import { useState } from 'react';
import { Text, View, useWindowDimensions, type DimensionValue } from 'react-native';

import type { FullscreenTimerPreferences } from '../../../backend/domain/timer/fullscreenTimer';
import type { TimerStatus } from '../../../backend/domain/timer/timer';
import { fullscreenPresentation as theme, timerPresentation } from '../../../constants/timerTheme';
import { timerPresentationEn as text } from '../../../constants/strings/timerPresentationEn';
import { spacing } from '../../../constants/theme';
import { fullscreenColors, fullscreenDigitSize } from '../../utils/timerPresentation';
import { styles } from '../../styles/timer/timerPresentation.styles';

export function FullscreenTimerStatus({
  stateLabel, status, overtime,
}: {
  readonly stateLabel: string;
  readonly status: TimerStatus;
  readonly overtime: boolean;
}) {
  const paused = status === 'paused';
  const late = overtime && status === 'running';
  return (
    <View
      className="self-start rounded-full px-app-medium py-app-small"
      style={{ backgroundColor: paused ? theme.pausedBackground : theme.panel }}
    >
      <Text className="text-xs font-bold" style={{ color: late ? theme.overtime : paused ? theme.pausedText : theme.muted }}>
        {stateLabel.toUpperCase()}
      </Text>
    </View>
  );
}

export default function FullscreenTimerFace({
  preferences, digits, stateLabel, durationLabel, partTitle, progress, overtime,
  fontSize, meetingTitle, layout, status,
}: {
  readonly preferences: FullscreenTimerPreferences;
  readonly digits: string;
  readonly stateLabel: string;
  readonly durationLabel: string;
  readonly partTitle: string;
  readonly progress: number;
  readonly overtime: boolean;
  readonly fontSize: number;
  readonly meetingTitle: string;
  readonly layout: 'preview' | 'portrait' | 'landscape';
  readonly status: TimerStatus;
}) {
  const { fontScale } = useWindowDimensions();
  const [area, setArea] = useState({ width: 0, height: 0 });
  const colors = fullscreenColors(preferences);
  const preview = layout === 'preview';
  const landscape = layout === 'landscape';
  const percent = Math.max(0, Math.min(100, progress));
  const width = (percent + '%') as DimensionValue;
  const scale = { small: 0.8, standard: 1, large: 1.25 } as const;
  const digitSize = preview || area.width === 0 || area.height === 0
    ? fontSize * scale[preferences.textSize]
    : fullscreenDigitSize(area.width, area.height, digits, fontScale, preferences.textSize);

  return (
    <View style={{ flex: preview ? undefined : 1, width: '100%', gap: spacing.small, backgroundColor: colors.background }}>
      <View style={{
        flex: !preview && !landscape ? (preferences.showCurrentPart ? 0.55 : 0.2) : undefined,
        justifyContent: 'center',
        flexDirection: landscape ? 'row' : 'column',
        gap: spacing.small,
      }}>
        <View style={{ flex: landscape ? 1 : undefined, gap: spacing.small }}>
          <Text className="text-sm font-semibold" style={{ color: colors.muted, textAlign: landscape ? 'left' : 'center' }}>
            {meetingTitle.toUpperCase()}
          </Text>
          {preferences.showCurrentPart ? (
            <Text accessibilityRole="header" className="text-app-title font-bold" style={{ color: colors.digits, textAlign: landscape ? 'left' : 'center' }}>
              {partTitle}
            </Text>
          ) : null}
        </View>
        {landscape || preview ? <FullscreenTimerStatus stateLabel={stateLabel} status={status} overtime={overtime} /> : null}
      </View>

      <View
        onLayout={event => {
          const { width: nextWidth, height: nextHeight } = event.nativeEvent.layout;
          setArea(previous => previous.width === nextWidth && previous.height === nextHeight
            ? previous : { width: nextWidth, height: nextHeight });
        }}
        style={{ flex: preview ? undefined : 1, minHeight: preview ? undefined : 80, justifyContent: 'center', gap: spacing.small }}
      >
        <Text
          accessibilityLabel={stateLabel + ': ' + digits}
          accessibilityLiveRegion="none"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={timerPresentation.minimumDigitScale}
          style={[styles.digits, {
            color: overtime ? colors.overtime : colors.digits,
            fontSize: digitSize,
            lineHeight: digitSize * 1.1,
            includeFontPadding: false,
          }]}
        >
          {digits}
        </Text>
        <Text className="text-center text-app-body" style={{ color: colors.muted }}>
          {text.allotted(durationLabel)}{' · '}{stateLabel}
        </Text>
      </View>

      {preferences.showProgress ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={text.progress}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          style={[styles.progressTrack, { backgroundColor: colors.track }]}
        >
          <View style={[styles.progressFill, {
            width, minWidth: timerPresentation.progressHeight,
            backgroundColor: overtime ? colors.overtime : colors.muted,
          }]} />
        </View>
      ) : null}
    </View>
  );
}
