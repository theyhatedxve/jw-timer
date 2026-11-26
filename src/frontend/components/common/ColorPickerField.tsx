import { useEffect, useId, useRef, useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { fullscreenTimerEn as text } from '../../../constants/strings/fullscreenTimerEn';
import { hexToHsv, hsvToHex, type HsvColor } from '../../utils/colorPicker';
import AppButton from './AppButton';
import AppInput from './AppInput';

const swatches = [
  '#FFFFFF', '#000000', '#FF5555', '#FF9900', '#FFDD00',
  '#22C55E', '#00C2C7', '#3B82F6', '#A855F7', '#F472B6',
];

export default function ColorPickerField({
  label, value, themeColor, onChange,
}: {
  readonly label: string;
  readonly value: string;
  readonly themeColor: string;
  readonly onChange: (value: string) => void;
}) {
  const displayed = /^#[0-9a-f]{6}$/i.test(value) ? value : themeColor;
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(() => hexToHsv(displayed));
  const lastEmitted = useRef(value);
  const [shadeWidth, setShadeWidth] = useState(0);
  const [hueWidth, setHueWidth] = useState(0);
  const gradientId = useId().replace(/[^a-z0-9]/gi, '');
  const whiteId = 'white' + gradientId;
  const blackId = 'black' + gradientId;
  const hueId = 'hue' + gradientId;

  useEffect(() => {
    if (value !== lastEmitted.current || value === 'theme') {
      setColor(hexToHsv(displayed));
      lastEmitted.current = value;
    }
  }, [value, displayed]);

  function choose(next: HsvColor) {
    setColor(next);
    const hex = hsvToHex(next);
    lastEmitted.current = hex;
    onChange(hex);
  }

  function chooseShade(event: GestureResponderEvent) {
    if (shadeWidth <= 0) return;
    choose({
      ...color,
      s: Math.max(0, Math.min(1, event.nativeEvent.locationX / shadeWidth)),
      v: 1 - Math.max(0, Math.min(1, event.nativeEvent.locationY / 180)),
    });
  }

  function chooseHue(event: GestureResponderEvent) {
    if (hueWidth <= 0) return;
    choose({ ...color, h: Math.max(0, Math.min(360, event.nativeEvent.locationX / hueWidth * 360)) });
  }

  return (
    <View className="gap-app-small">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label + ': ' + (value === 'theme' ? text.themeColor : value)}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(current => !current)}
        className="min-h-app-touch flex-row items-center gap-app-small rounded-app-button border border-app-border p-app-small"
      >
        <View className="h-8 w-8 rounded border border-app-border" style={{ backgroundColor: displayed }} />
        <View className="flex-1">
          <Text className="text-app-body font-semibold text-app-text">{label}</Text>
          <Text className="text-sm text-app-secondary">{value === 'theme' ? text.themeColor : value}</Text>
        </View>
        <Text accessible={false} className="text-app-body text-app-secondary">{open ? '⌃' : '⌄'}</Text>
      </Pressable>

      {open ? (
        <View className="gap-app-small">
          <Text className="text-sm text-app-secondary">{text.shadeHint}</Text>
          <View
            style={{ height: 180 }}
            onLayout={event => setShadeWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={chooseShade}
            onResponderMove={chooseShade}
            accessible={false}
          >
            <Svg width="100%" height="100%" pointerEvents="none">
              <Defs>
                <LinearGradient id={whiteId} x1="0%" x2="100%" y1="0%" y2="0%">
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={1} />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
                </LinearGradient>
                <LinearGradient id={blackId} x1="0%" x2="0%" y1="0%" y2="100%">
                  <Stop offset="0%" stopColor="#000000" stopOpacity={0} />
                  <Stop offset="100%" stopColor="#000000" stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={hsvToHex({ h: color.h, s: 1, v: 1 })} />
              <Rect width="100%" height="100%" fill={'url(#' + whiteId + ')'} />
              <Rect width="100%" height="100%" fill={'url(#' + blackId + ')'} />
            </Svg>
            <View pointerEvents="none" style={{
              position: 'absolute', left: color.s * shadeWidth - 7,
              top: (1 - color.v) * 180 - 7, width: 14, height: 14,
              borderRadius: 7, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: hsvToHex(color),
            }} />
          </View>

          <Text className="text-sm text-app-secondary">{text.hue}</Text>
          <View
            style={{ height: 48 }}
            onLayout={event => setHueWidth(event.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false}
            onResponderGrant={chooseHue}
            onResponderMove={chooseHue}
            accessibilityRole="adjustable"
            accessibilityLabel={text.hue}
            accessibilityValue={{ min: 0, max: 360, now: Math.round(color.h) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={event => choose({
              ...color,
              h: (color.h + (event.nativeEvent.actionName === 'increment' ? 15 : -15) + 360) % 360,
            })}
          >
            <Svg width="100%" height="100%" pointerEvents="none">
              <Defs>
                <LinearGradient id={hueId} x1="0%" x2="100%" y1="0%" y2="0%">
                  {['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'].map((hex, index) => (
                    <Stop key={index} offset={index / 6} stopColor={hex} />
                  ))}
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill={'url(#' + hueId + ')'} />
            </Svg>
            <View pointerEvents="none" style={{
              position: 'absolute', left: Math.max(0, Math.min(hueWidth - 4, color.h / 360 * hueWidth)),
              top: 0, bottom: 0, width: 4, borderWidth: 1, borderColor: '#000000', backgroundColor: '#FFFFFF',
            }} />
          </View>

          <View className="flex-row flex-wrap gap-app-small">
            {swatches.map(hex => (
              <Pressable
                key={hex}
                accessibilityRole="button"
                accessibilityLabel={text.pickColor(hex)}
                accessibilityState={{ selected: value.toUpperCase() === hex }}
                onPress={() => choose(hexToHsv(hex))}
                className="min-h-app-touch min-w-app-touch items-center justify-center rounded-app-button border border-app-border"
                style={{ backgroundColor: hex, borderWidth: value.toUpperCase() === hex ? 3 : 1 }}
              />
            ))}
          </View>
          <AppInput
            accessibilityLabel={text.hexColor(label)}
            value={value}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={7}
            onChangeText={next => onChange(next.trim())}
          />
          <AppButton label={text.themeColor} onPress={() => onChange('theme')} />
        </View>
      ) : null}
    </View>
  );
}
