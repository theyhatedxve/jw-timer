import { View } from 'react-native';
import Svg, { Circle, G, Line, Text as SvgText } from 'react-native-svg';

import { fullscreenTimerEn as text } from '../../../constants/strings/fullscreenTimerEn';
import { countdownDialHands } from '../../utils/timerPresentation';

interface Props {
  readonly remainingMs: number;
  readonly size: number;
  readonly color: string;
  readonly mutedColor: string;
  readonly trackColor: string;
  readonly overtime: boolean;
  readonly accessibilityLabel?: string;
}

export default function AnalogTimerFace({
  remainingMs, size, color, mutedColor, trackColor, overtime, accessibilityLabel,
}: Props) {
  const hands = countdownDialHands(remainingMs);

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
        <SvgText x={100} y={41} fill={mutedColor} fontSize={13} textAnchor="middle">0</SvgText>
        <SvgText x={164} y={105} fill={mutedColor} fontSize={13} textAnchor="middle">15</SvgText>
        <SvgText x={100} y={171} fill={mutedColor} fontSize={13} textAnchor="middle">30</SvgText>
        <SvgText x={36} y={105} fill={mutedColor} fontSize={13} textAnchor="middle">45</SvgText>
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
