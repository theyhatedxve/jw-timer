import type { ReactNode } from 'react';
import { View } from 'react-native';

export default function AppCard({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <View className="gap-app-medium rounded-app-card border border-app-border bg-app-surface p-app-medium">
      {children}
    </View>
  );
}
