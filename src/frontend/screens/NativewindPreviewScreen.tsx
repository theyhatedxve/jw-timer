import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../../constants/theme';
import { nativewindPreviewEn as text } from '../../constants/strings/nativewindPreviewEn';
import { nativewindPreviewThemes } from '../styles/diagnostics/nativewindPreview.theme';

export default function NativewindPreviewScreen() {
  const [mode, setMode] = useState<'dark' | 'light'>('dark');
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-preview-canvas"
      style={nativewindPreviewThemes[mode]}
      contentContainerClassName="grow gap-preview-gap p-preview-outer"
      contentContainerStyle={{
        paddingBottom: insets.bottom + spacing.large,
      }}
    >
      <View className="w-full max-w-preview-content self-center gap-preview-gap">
        <Text
          accessibilityRole="header"
          className="text-preview-title font-bold text-preview-text"
        >
          {text.heading}
        </Text>

        <Text className="text-preview-body text-preview-secondary">
          {text.description}
        </Text>

        <View className="gap-preview-gap rounded-preview-card border border-preview-border bg-preview-surface p-preview-gap">
          <Text
            accessibilityRole="header"
            className="text-preview-body font-bold text-preview-text"
          >
            {text.cardTitle}
          </Text>

          <Text className="text-preview-body text-preview-secondary">
            {text.cardDescription}
          </Text>

          <Text
            accessibilityLiveRegion="polite"
            className="text-preview-body font-semibold text-preview-text"
          >
            {mode === 'dark' ? text.dark : text.light}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setMode(current => current === 'dark' ? 'light' : 'dark');
            }}
            className="min-h-preview-touch min-w-preview-touch items-center justify-center rounded-preview-button bg-preview-brand p-preview-gap active:opacity-75"
          >
            <Text className="text-center text-preview-body font-bold text-preview-onBrand">
              {mode === 'dark'
                ? text.switchToLight
                : text.switchToDark}
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
