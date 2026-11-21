import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { spacing } from '../../../constants/theme';

export default function AppScreen({
  children,
}: {
  readonly children: ReactNode;
}) {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-app-canvas"
      contentContainerClassName="grow p-app-large"
      contentContainerStyle={{
        paddingBottom: insets.bottom + spacing.large,
        paddingLeft: Math.max(insets.left, spacing.large),
        paddingRight: Math.max(insets.right, spacing.large),
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-app-content self-center gap-app-medium">
        {children}
      </View>
    </ScrollView>
  );
}
