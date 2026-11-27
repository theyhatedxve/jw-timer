import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { onboardingTheme as color } from '../../../constants/onboardingTheme';
import { onboardingEn as text } from '../../../constants/strings/onboardingEn';
import AppIcon from '../common/AppIcon';

export function OnboardingMark({ small = false }: { readonly small?: boolean }) {
  const size = small ? 76 : 132;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={[styles.mark, { width: size, height: size, borderRadius: size / 4.5 }]}>
      <AppIcon name="book" size={size * 0.62} color={color.white} />
      <View style={[styles.markTimer, { width: size * 0.43, height: size * 0.43, borderRadius: size, right: size * 0.07, bottom: size * 0.07 }]}>
        <AppIcon name="timer" size={size * 0.35} color={color.white} />
      </View>
    </View>
  );
}

export function OnboardingWaves({ welcome = false }: { readonly welcome?: boolean }) {
  return (
    <View pointerEvents="none" accessible={false} style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 110" preserveAspectRatio="none">
        <Path d="M0 30C100 90 210 0 400 38V110H0Z" fill={welcome ? color.mint : color.line} opacity={0.45} />
        <Path d="M0 62C130 16 260 100 400 40V110H0Z" fill={welcome ? color.teal : color.mint} opacity={0.55} />
        <Path d="M0 80C130 110 280 26 400 70V110H0Z" fill={welcome ? color.welcomeDeep : color.teal} opacity={welcome ? 0.8 : 0.35} />
      </Svg>
    </View>
  );
}

export function ProgramPreview() {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.artboard}>
      <View style={styles.backdrop} />
      <View style={styles.calendar}>
        <View style={styles.calendarTop}><AppIcon name="meetings" size={26} color={color.white} /></View>
        <View style={styles.calendarGrid}>
          {Array.from({ length: 9 }, (_, index) => <View key={index} style={styles.day} />)}
        </View>
      </View>
      <View style={styles.phone}>
        <View style={styles.phoneTop}>
          <View style={styles.notch} />
          <View style={styles.phoneHeading}>
            <Text allowFontScaling={false} style={styles.phoneTitle}>{text.preview.meetings}</Text>
            <AppIcon name="list" color={color.white} size={19} />
          </View>
        </View>
        <View style={styles.program}>
          {[0, 1, 2, 3, 4].map(index => (
            <View key={index} style={styles.programRow}>
              <AppIcon name="timer" size={20} color={color.teal} />
              <View style={styles.programLines}>
                <View style={[styles.line, { width: index % 2 ? '70%' : '90%' }]} />
                <View style={styles.shortLine} />
              </View>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.pdf}>
        <AppIcon name="document" color={color.document} size={38} />
        <Text allowFontScaling={false} style={styles.pdfLabel}>{text.preview.document}</Text>
      </View>
    </View>
  );
}

export function TimerPreview() {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.artboard}>
      <View style={styles.backdrop} />
      <View style={styles.timer}>
        <View style={styles.timerNotch} />
        <Text allowFontScaling={false} style={styles.part}>{text.preview.part}</Text>
        <Text allowFontScaling={false} style={styles.digits}>{text.preview.digits}</Text>
        <View style={styles.track}><View style={styles.progress} /></View>
        <View style={styles.controls}>
          <View style={styles.previewPlay}><AppIcon name="play" color={color.white} size={26} /></View>
          <View style={styles.previewReset}><AppIcon name="restart" color={color.white} size={26} /></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { backgroundColor: color.teal, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  markTimer: { position: 'absolute', alignItems: 'center', justifyContent: 'center', backgroundColor: color.welcome },
  artboard: { width: 310, height: 300, alignSelf: 'center', justifyContent: 'center' },
  backdrop: { position: 'absolute', width: 280, height: 246, borderRadius: 100, backgroundColor: color.pale, alignSelf: 'center', transform: [{ rotate: '-18deg' }] },
  phone: { width: 178, height: 280, alignSelf: 'center', borderWidth: 7, borderColor: color.welcome, borderRadius: 30, backgroundColor: color.white, overflow: 'hidden', transform: [{ rotate: '-7deg' }] },
  phoneTop: { backgroundColor: color.teal, paddingHorizontal: 12, paddingBottom: 14 },
  notch: { width: 76, height: 12, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: color.welcome, alignSelf: 'center', marginBottom: 15 },
  phoneHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneTitle: { color: color.white, fontSize: 15, fontWeight: '700' },
  program: { gap: 7, padding: 9 },
  programRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 7, backgroundColor: color.pale, borderRadius: 7 },
  programLines: { flex: 1, gap: 4 },
  line: { height: 7, backgroundColor: color.previewLine },
  shortLine: { height: 4, width: '65%', backgroundColor: color.line },
  calendar: { position: 'absolute', top: 88, left: 7, width: 88, height: 103, borderWidth: 5, borderColor: color.welcome, borderRadius: 15, backgroundColor: color.white, transform: [{ rotate: '-9deg' }] },
  calendarTop: { height: 33, backgroundColor: color.teal, alignItems: 'center', justifyContent: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, padding: 10 },
  day: { width: 10, height: 9, backgroundColor: color.previewLine },
  pdf: { position: 'absolute', right: 4, bottom: 24, width: 73, height: 101, borderWidth: 3, borderColor: color.line, borderRadius: 10, backgroundColor: color.white, alignItems: 'center', justifyContent: 'center', gap: 4, transform: [{ rotate: '9deg' }] },
  pdfLabel: { color: color.document, fontSize: 18, fontWeight: '800' },
  timer: { width: 284, borderWidth: 7, borderColor: color.welcome, borderRadius: 25, backgroundColor: color.welcomeDeep, alignSelf: 'center', padding: 18, gap: 13, transform: [{ rotate: '-5deg' }] },
  timerNotch: { width: 30, height: 4, borderRadius: 2, backgroundColor: color.teal, alignSelf: 'center' },
  part: { color: color.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  digits: { color: color.white, fontSize: 63, fontWeight: '800', fontVariant: ['tabular-nums'], textAlign: 'center', lineHeight: 75 },
  track: { height: 6, borderRadius: 3, backgroundColor: color.teal, overflow: 'hidden' },
  progress: { width: '45%', height: '100%', backgroundColor: color.white, borderRadius: 3 },
  controls: { flexDirection: 'row', gap: 14, marginTop: 2 },
  previewPlay: { flex: 1, height: 42, backgroundColor: color.teal, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  previewReset: { flex: 1, height: 42, backgroundColor: color.document, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
