import { View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { fullscreenTimerEn as text } from '../../../constants/strings/fullscreenTimerEn';
import { countdownDialFraction, countdownDialHands } from '../../utils/timerPresentation';

interface Props {
  readonly remainingMs: number;
  readonly durationMs: number;
  readonly remainingColor: string;
  readonly size: number;
  readonly color: string;
  readonly mutedColor: string;
  readonly trackColor: string;
  readonly overtime: boolean;
  readonly accessibilityLabel?: string;
}

export default function AnalogTimerFace({
  remainingMs, durationMs, remainingColor, size, color, mutedColor, trackColor, overtime, accessibilityLabel,
}: Props) {
  const hands = countdownDialHands(remainingMs);
  const fraction = countdownDialFraction(remainingMs, durationMs);
  const angle = fraction * 2 * Math.PI;
  const sectorX = 100 + 91 * Math.sin(angle);
  const sectorY = 100 - 91 * Math.cos(angle);
  const sector = 'M100 100 L100 9 A91 91 0 ' +
    (fraction > 0.5 ? '1' : '0') + ' 1 ' + sectorX + ' ' + sectorY + ' Z';

  return (
    <View
      accessible={accessibilityLabel !== undefined}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="none"
      importantForAccessibility={accessibilityLabel ? 'yes' : 'no-hide-descendants'}
      style={{ width: size, height: size }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 200 200" accessible={false}>
        {fraction >= 1 ? (
          <Circle cx={100} cy={100} r={91} fill={remainingColor} fillOpacity={0.65} />
        ) : fraction > 0 ? (
          <Path d={sector} fill={remainingColor} fillOpacity={0.65} />
        ) : null}
        <Circle cx={100} cy={100} r={94} fill="none" stroke={trackColor} strokeWidth={2} />
        {Array.from({ length: 60 }, (_, index) => (
          <G key={index} rotation={index * 6} origin="100, 100">
            <Line
              x1={100} y1={10} x2={100} y2={index % 5 === 0 ? 23 : 17}
              stroke={mutedColor} strokeWidth={index % 5 === 0 ? 2 : 1}
              opacity={index % 5 === 0 ? 1 : 0.5}
            />
          </G>
        ))}
        {Array.from({ length: 12 }, (_, index) => {
          const number = index + 1;
          const radians = number * Math.PI / 6;
          return (
            <SvgText
              key={number}
              x={100 + 69 * Math.sin(radians)}
              y={105 - 69 * Math.cos(radians)}
              fill={mutedColor}
              fontSize={13}
              fontWeight="700"
              textAnchor="middle"
            >
              {number}
            </SvgText>
          );
        })}
        <SvgText x={100} y={76} fill={mutedColor} fontSize={10} textAnchor="middle">
          {overtime ? text.dialOvertime : text.dialRemaining}
        </SvgText>
        {hands.hours > 0 ? (
          <SvgText x={100} y={138} fill={color} fontSize={14} fontWeight="700" textAnchor="middle">
            {text.dialHours(hands.hours)}
          </SvgText>
        ) : null}
        <G rotation={hands.minuteAngle} origin="100, 100">
          <Line x1={100} y1={108} x2={100} y2={46} stroke={color} strokeWidth={5} strokeLinecap="round" />
        </G>
        <G rotation={hands.secondAngle} origin="100, 100">
          <Line x1={100} y1={113} x2={100} y2={28} stroke={color} strokeWidth={2} strokeLinecap="round" />
        </G>
        <Circle cx={100} cy={100} r={5} fill={color} />
      </Svg>
    </View>
  );
}
