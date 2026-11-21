import { Pressable, Text } from 'react-native';

import { en } from '../../../constants/strings/en';
import { styles } from '../../styles/navigation/tabs.styles';

interface Props {
  readonly onPress: () => void;
}

export default function SettingsButton({ onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en.actions.openSettings}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsButton,
        pressed && styles.settingsPressed,
      ]}
    >
      <Text
        accessible={false}
        allowFontScaling={false}
        style={styles.settingsGlyph}
      >
        ⚙
      </Text>
    </Pressable>
  );
}