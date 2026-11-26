import { Text, View, type DimensionValue } from 'react-native';

import type { FullscreenTimerPreferences } from '../../../backend/domain/timer/fullscreenTimer';
import type { AppPalette } from '../../../constants/appearanceTheme';
import { timerPresentationEn as text } from '../../../constants/strings/timerPresentationEn';
import { useAppTheme } from '../../context/AppearanceContext';
import { styles } from '../../styles/timer/timerPresentation.styles';

const digitScales = { small: 0.8, standard: 1, large: 1.25 } as const;

export function fullscreenColors(preferences: FullscreenTimerPreferences, palette: AppPalette) {
  return {
    background: preferences.background === 'theme' ? palette.canvas : preferences.background,
    digits: preferences.digits === 'theme' ? palette.text : preferences.digits,
    overtime: preferences.overtime === 'theme' ? palette.danger : preferences.overtime,
  };
}

export default function FullscreenTimerFace({
  preferences, digits, stateLabel, durationLabel, partTitle, progress, overtime, fontSize,
}: {
  readonly preferences: FullscreenTimerPreferences;
  readonly digits: string;
  readonly stateLabel: string;
  readonly durationLabel: string;
  readonly partTitle: string;
  readonly progress: number;
  readonly overtime: boolean;
  readonly fontSize: number;
}) {
  const { palette } = useAppTheme();
  const colors = fullscreenColors(preferences, palette);
  const color = overtime ? colors.overtime : colors.digits;
  const percent = Math.max(0, Math.min(100, progress));
  const width = (percent + '%') as DimensionValue;

  return (
    <View className="gap-app-medium" style={{ backgroundColor: colors.background }}>
      <View className="self-center rounded-full border px-app-medium py-app-small" style={{ borderColor: color }}>
        <Text className="text-app-body font-bold" style={{ color }}>{stateLabel}</Text>
      </View>
      <Text
        accessibilityLabel={stateLabel + ': ' + digits}
        accessibilityLiveRegion="none"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.3}
        style={[styles.digits, { color, fontSize: fontSize * digitScales[preferences.textSize] }]}
      >
        {digits}
      </Text>
      <Text className="text-center text-app-body" style={{ color: colors.digits }}>
        {text.allotted(durationLabel)}
      </Text>
      {preferences.showProgress ? (
        <View
          accessibilityRole="progressbar"
          accessibilityLabel={text.progress}
          accessibilityValue={{ min: 0, max: 100, now: percent }}
          style={[styles.progressTrack, { backgroundColor: colors.digits + '33' }]}
        >
          <View style={[styles.progressFill, { width, backgroundColor: color }]} />
        </View>
      ) : null}
      {preferences.showCurrentPart ? (
        <View className="gap-app-small rounded-app-card border p-app-medium" style={{ borderColor: colors.digits + '66' }}>
          <Text className="text-app-body" style={{ color: colors.digits }}>{text.current}</Text>
          <Text accessibilityRole="header" className="text-app-body font-bold" style={{ color: colors.digits }}>
            {partTitle}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
