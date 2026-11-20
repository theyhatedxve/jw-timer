import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, dimensions, spacing, typography } from '../../constants/theme';
import { en } from '../../constants/strings/en';
import type { useSectionScreen } from '../../hooks/useSectionScreen';

export default function SectionView({ content, actions }: ReturnType<typeof useSectionScreen>) {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.appName}>{en.appName}</Text>

        <Text accessibilityRole="header" style={styles.title}>
          {content.title}
        </Text>

        <Text style={styles.description}>
          {content.description}
        </Text>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.heading}>
            {content.heading}
          </Text>

          <Text style={styles.body}>{content.body}</Text>
        </View>

        {actions.map((action) => (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Text style={styles.buttonText}>{action.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: dimensions.contentWidth,
    alignSelf: 'center',
    padding: spacing.large,
    gap: spacing.medium,
  },
  appName: {
    color: colors.brand,
    fontSize: typography.supporting,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '700',
  },
  description: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  card: {
    padding: spacing.medium,
    gap: spacing.medium,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: dimensions.borderWidth,
    borderRadius: dimensions.cardRadius,
  },
  heading: {
    color: colors.text,
    fontSize: typography.heading,
    fontWeight: '600',
  },
  body: {
    color: colors.secondary,
    fontSize: typography.body,
    lineHeight: typography.bodyLineHeight,
  },
  button: {
    minHeight: dimensions.minimumTouchTarget,
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: colors.brand,
    borderRadius: dimensions.buttonRadius,
  },
  buttonPressed: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    color: colors.onBrand,
    fontSize: typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
