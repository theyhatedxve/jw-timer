import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AppResetService } from '../../backend/services/appResetService';
import { appResetEn as text } from '../../constants/strings/appResetEn';
import { colors, dimensions, spacing, typography } from '../../constants/theme';

type Phase = 'checking' | 'ready' | 'resetting' | 'checkError' | 'resetError';
const AppResetContext = createContext<(() => void) | null>(null);

export function AppResetProvider({ service, children }: {
  readonly service: AppResetService;
  readonly children: ReactNode;
}) {
  const [phase, setPhase] = useState<Phase>('checking');
  const requestReset = useCallback(() => {
    setPhase(current => current === 'ready' ? 'resetting' : current);
  }, []);

  useEffect(() => {
    if (phase === 'checking') {
      try {
        setPhase(service.isPending() ? 'resetting' : 'ready');
      } catch {
        setPhase('checkError');
      }
    } else if (phase === 'resetting') {
      // This passive effect runs after the removed app's cleanup effects.
      // No mounted timer or navigation listener can save old state afterward.
      setPhase(service.reset() ? 'ready' : 'resetError');
    }
  }, [phase, service]);

  if (phase === 'ready') {
    return <AppResetContext.Provider value={requestReset}>{children}</AppResetContext.Provider>;
  }

  const failed = phase === 'checkError' || phase === 'resetError';
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        {!failed ? <ActivityIndicator color={colors.brand} /> : null}
        <Text accessibilityRole={failed ? 'alert' : undefined} accessibilityLiveRegion="polite" style={styles.text}>
          {text[phase]}
        </Text>
        {failed ? (
          <Pressable accessibilityRole="button" onPress={() => setPhase(phase === 'checkError' ? 'checking' : 'resetting')} style={styles.button}>
            <Text style={styles.buttonText}>{text.retry}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

export function useAppReset(): () => void {
  const requestReset = useContext(AppResetContext);
  if (!requestReset) throw new Error('AppResetProvider is required.');
  return requestReset;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas, justifyContent: 'center', padding: spacing.large },
  content: { alignSelf: 'center', width: '100%', maxWidth: dimensions.contentWidth, gap: spacing.medium },
  text: { color: colors.text, fontSize: typography.body, lineHeight: typography.bodyLineHeight, textAlign: 'center' },
  button: { minHeight: dimensions.minimumTouchTarget, padding: spacing.medium, borderRadius: dimensions.buttonRadius, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.onBrand, fontSize: typography.body, fontWeight: '600' },
});
