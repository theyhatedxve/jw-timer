import { useCallback, useRef, useState } from 'react';
import {
  AccessibilityInfo, BackHandler, Image, Pressable, ScrollView, StyleSheet,
  Text, useWindowDimensions, View,
} from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { onboardingEn as text } from '../../constants/strings/onboardingEn';
import { onboardingTheme as color } from '../../constants/onboardingTheme';
import { spacing } from '../../constants/theme';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../context/AppearanceContext';
import { useOnboarding } from '../context/OnboardingContext';
import AppIcon from '../components/common/AppIcon';
import {
  OnboardingMark, OnboardingWaves, ProgramPreview, TimerPreview,
} from '../components/onboarding/OnboardingArtwork';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;
const INTRO_COUNT = 3;
const READY_STEP = 3;

function IntroButton({ label, onPress, secondary = false, welcome = false, chevron = false }: {
  readonly label: string;
  readonly onPress: () => void;
  readonly secondary?: boolean;
  readonly welcome?: boolean;
  readonly chevron?: boolean;
}) {
  const { palette, resolved } = useAppTheme();
  const foreground = welcome ? color.ink : secondary ? palette.text : palette.onBrand;
  const background = welcome ? color.white : secondary ? 'transparent' : resolved === 'light' ? color.teal : palette.brand;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="active:opacity-75"
      style={[
        styles.button,
        { backgroundColor: background, borderColor: secondary ? palette.border : background },
        welcome && styles.welcomeButton,
      ]}
    >
      <Text style={[styles.buttonText, { color: foreground }]}>{label}</Text>
      {chevron ? <View pointerEvents="none" style={styles.buttonChevron}><AppIcon name="chevronRight" color={foreground} size={22} /></View> : null}
    </Pressable>
  );
}

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const [saveError, setSaveError] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  const { palette, resolved } = useAppTheme();
  const { complete } = useOnboarding();
  const { width, height } = useWindowDimensions();
  const landscape = width >= 640 && width > height;
  const previewWidth = landscape ? (width - spacing.large * 4) / 2 : width - spacing.large * 2;
  const previewScale = Math.min(1, previewWidth / 310);
  const welcome = step === 0;
  const ready = step === READY_STEP;
  const slide = text.steps[step === 1 ? 0 : 1];
  const title = welcome ? text.appName : ready ? text.readyTitle : text.steps[step === 1 ? 0 : 1].title.replace('\n', ' ');
  const paper = resolved === 'light' ? color.paper : palette.canvas;
  const background = welcome ? color.welcome : paper;

  const move = useCallback((target: number) => {
    setStep(Math.max(0, Math.min(READY_STEP, target)));
    setSaveError(false);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }, []);

  useFocusEffect(useCallback(() => {
    AccessibilityInfo.announceForAccessibility(
      ready ? title : text.step(step + 1, INTRO_COUNT) + '. ' + title,
    );
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      move(step - 1);
      return true;
    });
    return () => subscription.remove();
  }, [step, title, ready, move]));

  function later() {
    if (!complete()) setSaveError(true);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: background }]}>
      <StatusBar style={welcome || resolved === 'dark' ? 'light' : 'dark'} />
      <View style={styles.viewport}>
        {(welcome || ready) ? <View pointerEvents="none" style={styles.waves}><OnboardingWaves welcome={welcome} /></View> : null}
        <ScrollView
          ref={scroll}
          style={styles.viewport}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, landscape && styles.wide]}>
            {welcome ? (
              <View style={[styles.main, styles.welcomeMain, landscape && styles.columns]}>
                <View style={[styles.welcomeIdentity, landscape && styles.column]}>
                  <OnboardingMark />
                  <Text accessibilityRole="header" style={styles.welcomeTitle}>{text.welcomeTitle}</Text>
                  <Text style={styles.tagline}>{text.tagline}</Text>
                </View>
                <View style={[styles.features, landscape && styles.column]}>
                  {text.features.map(feature => (
                    <View key={feature.icon} style={styles.feature}>
                      <View style={styles.featureIcon}><AppIcon name={feature.icon} color={color.white} size={32} /></View>
                      <View style={styles.featureText}>
                        <Text style={styles.featureTitle}>{feature.title}</Text>
                        <Text style={styles.featureBody}>{feature.body}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : ready ? (
              <View style={[styles.main, landscape && styles.readyColumns]}>
                <View style={[styles.readyCopy, landscape && styles.column]}>
                  <View style={[styles.readyHeading, landscape && styles.readyHeadingWide]}>
                    <OnboardingMark small />
                    <Text accessibilityRole="header" style={[styles.title, { color: palette.text }, landscape && styles.readyTitleWide]}>{text.readyTitle}</Text>
                  </View>
                  <Text style={[styles.body, { color: palette.secondary }, landscape && styles.leftText]}>{text.readyBody}</Text>
                </View>
                <Image
                  source={require('../assets/onboarding/meeting-hall.png')}
                  resizeMode="contain"
                  accessible={false}
                  style={[styles.hall, landscape && styles.hallWide]}
                />
              </View>
            ) : (
              <View style={[styles.main, landscape && styles.columns]}>
                <View style={[styles.art, landscape && styles.column]}>
                  <View style={{ transform: [{ scale: previewScale }], marginVertical: -150 * (1 - previewScale) }}>
                    {step === 1 ? <ProgramPreview /> : <TimerPreview />}
                  </View>
                </View>
                <View style={[styles.slideCopy, landscape && styles.column]}>
                  <Text accessibilityRole="header" style={[styles.title, { color: palette.text }]}>{slide.title}</Text>
                  <Text style={[styles.body, { color: palette.secondary }]}>{slide.body}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      <View style={[styles.footer, { backgroundColor: background }]}>
        <View style={styles.footerContent}>
          {ready ? (
            <>
              {saveError ? <Text accessibilityRole="alert" style={[styles.body, { color: palette.danger }]}>{text.saveError}</Text> : null}
              <IntroButton label={text.setup} onPress={() => navigation.navigate('SetupProfile')} chevron />
              <IntroButton label={text.later} onPress={later} secondary />
            </>
          ) : (
            <>
              <View
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel={text.progress}
                accessibilityValue={{ min: 1, max: INTRO_COUNT, now: step + 1, text: text.step(step + 1, INTRO_COUNT) }}
                accessibilityActions={[{ name: 'increment', label: text.next }, { name: 'decrement', label: text.back }]}
                onAccessibilityAction={event => {
                  if (event.nativeEvent.actionName === 'increment') move(step + 1);
                  if (event.nativeEvent.actionName === 'decrement') move(step - 1);
                }}
                style={styles.dots}
              >
                {[0, 1, 2].map(index => (
                  <View key={index} style={[styles.dot, { backgroundColor: welcome ? color.white : palette.brand, opacity: index === step ? 1 : 0.3 }]} />
                ))}
              </View>
              <IntroButton label={welcome ? text.getStarted : text.next} onPress={() => move(step + 1)} welcome={welcome} chevron />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  viewport: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.large, paddingBottom: spacing.large, paddingTop: spacing.small },
  content: { flexGrow: 1, width: '100%', maxWidth: 460, alignSelf: 'center' },
  wide: { maxWidth: 960 },
  main: { flexGrow: 1, justifyContent: 'center', gap: spacing.large, paddingVertical: spacing.medium },
  columns: { flexDirection: 'row', alignItems: 'center', gap: spacing.large * 2 },
  column: { flex: 1, minWidth: 0 },
  welcomeMain: { gap: 30, paddingTop: spacing.large, paddingBottom: 38 },
  welcomeIdentity: { gap: spacing.medium },
  welcomeTitle: { fontSize: 38, lineHeight: 43, fontWeight: '800', textAlign: 'center', color: color.white },
  tagline: { fontSize: 18, lineHeight: 26, textAlign: 'center', color: color.white, paddingHorizontal: spacing.small },
  features: { gap: 20, width: '100%', maxWidth: 360, alignSelf: 'center' },
  feature: { flexDirection: 'row', alignItems: 'center', gap: spacing.medium },
  featureIcon: { width: 52, minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: color.welcomeDeep },
  featureText: { flex: 1, gap: 3 },
  featureTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: color.white },
  featureBody: { fontSize: 15, lineHeight: 21, color: color.welcomeSecondary },
  art: { alignItems: 'center', justifyContent: 'center' },
  slideCopy: { gap: 20, paddingBottom: spacing.large },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', textAlign: 'center' },
  body: { fontSize: 18, lineHeight: 26, textAlign: 'center' },
  footer: { paddingHorizontal: spacing.large, paddingTop: spacing.medium, paddingBottom: spacing.medium },
  footerContent: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: spacing.small },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 11, paddingBottom: spacing.medium },
  dot: { width: 11, height: 11, borderRadius: 6 },
  button: { width: '100%', minHeight: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  welcomeButton: { borderRadius: 26 },
  buttonChevron: { position: 'absolute', right: 18 },
  buttonText: { paddingHorizontal: 24, fontSize: 17, lineHeight: 24, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  waves: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  readyColumns: { flexDirection: 'row', alignItems: 'center', gap: spacing.large, paddingBottom: 50 },
  readyCopy: { gap: spacing.large },
  readyHeading: { alignItems: 'center', gap: spacing.medium },
  readyHeadingWide: { flexDirection: 'row' },
  readyTitleWide: { flex: 1, textAlign: 'left' },
  hall: { width: '100%', height: 230 },
  hallWide: { width: '48%', height: 310 },
  leftText: { textAlign: 'left' },
});
