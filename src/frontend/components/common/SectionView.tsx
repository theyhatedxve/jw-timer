import { styles } from '../../styles/common/section.styles';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { en } from '../../../constants/strings/en';
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


