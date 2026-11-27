import { useCallback, useState } from 'react';
import { AccessibilityInfo, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { onboardingEn as text } from '../../constants/strings/onboardingEn';
import { dimensions, spacing } from '../../constants/theme';
import { timerPresentation } from '../../constants/timerTheme';
import type { RootStackParamList } from '../navigation/types';
import { useAppTheme } from '../context/AppearanceContext';
import AppButton from '../components/common/AppButton';
import AppIcon from '../components/common/AppIcon';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const [step, setStep] = useState(0);
  const { palette } = useAppTheme();
  const slide = text.steps[step] ?? text.steps[0];
  const last = step === text.steps.length - 1;

  useFocusEffect(useCallback(() => {
    AccessibilityInfo.announceForAccessibility(
      text.step(step + 1, text.steps.length) + '. ' + slide.title,
    );
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 0) return false;
      setStep(current => Math.max(0, current - 1));
      return true;
    });
    return () => subscription.remove();
  }, [step, slide.title]));

  function setup() {
    navigation.navigate('SetupProfile');
  }

  function next() {
    if (last) setup();
    else setStep(current => Math.min(text.steps.length - 1, current + 1));
  }

  return (
    <SafeAreaView className="flex-1 bg-app-canvas">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: spacing.large }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full self-center gap-app-large" style={{ flexGrow: 1, maxWidth: dimensions.contentWidth }}>
          <View className="flex-row items-center gap-app-small">
            <Text className="flex-1 text-app-body font-bold text-app-text">{text.appName}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={setup}
              className="min-h-app-touch items-center justify-center px-app-small active:opacity-75"
            >
              <Text className="text-sm font-semibold text-app-brand">{text.skip}</Text>
            </Pressable>
          </View>

          <View style={{ flexGrow: 1, justifyContent: 'center', gap: spacing.large, paddingVertical: spacing.large }}>
            <View
              className="items-center justify-center gap-app-large p-app-large"
              style={{ minHeight: 180, borderRadius: timerPresentation.sessionRadius, backgroundColor: timerPresentation.sessionBackground }}
            >
              <AppIcon name={slide.icon} color={timerPresentation.sessionMuted} size={96} />
              <Text className="text-center text-sm" style={{ color: timerPresentation.sessionMuted }}>{slide.note}</Text>
            </View>
            <View className="gap-app-medium">
              <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">{slide.title}</Text>
              <Text className="text-app-body leading-7 text-app-secondary">{slide.body}</Text>
            </View>
          </View>

          <View className="gap-app-medium">
            <View className="flex-row items-center justify-between gap-app-small">
              {step > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setStep(current => Math.max(0, current - 1))}
                  className="min-h-app-touch flex-row items-center gap-app-small active:opacity-75"
                >
                  <AppIcon name="chevronLeft" color={palette.brand} size={20} />
                  <Text className="text-sm font-semibold text-app-brand">{text.back}</Text>
                </Pressable>
              ) : <View style={{ minWidth: dimensions.minimumTouchTarget, minHeight: dimensions.minimumTouchTarget }} />}
              <View
                accessible
                accessibilityRole="progressbar"
                accessibilityLabel={text.progress}
                accessibilityValue={{ min: 1, max: text.steps.length, now: step + 1, text: text.step(step + 1, text.steps.length) }}
                className="flex-row items-center gap-app-small"
              >
                {text.steps.map((item, index) => (
                  <View
                    key={item.icon}
                    className="h-2 rounded-full"
                    style={{ width: index === step ? spacing.large : spacing.small, backgroundColor: index === step ? palette.brand : palette.border }}
                  />
                ))}
              </View>
              <Text className="text-sm text-app-secondary">{text.step(step + 1, text.steps.length)}</Text>
            </View>
            <AppButton label={last ? text.setup : text.next} onPress={next} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
