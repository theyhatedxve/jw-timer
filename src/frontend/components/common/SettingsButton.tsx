import { useAppTheme } from '../../context/AppearanceContext';
import { Pressable, Text } from 'react-native';

import { en } from '../../../constants/strings/en';
import { styles } from '../../styles/navigation/tabs.styles';

interface Props {
  readonly onPress: () => void;
}

export default function SettingsButton({ onPress }: Props) {
  const { palette } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={en.actions.openSettings}
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsButton,
        pressed && { backgroundColor: palette.surface },
      ]}
    >
      <Text
        accessible={false}
        allowFontScaling={false}
        style={[styles.settingsGlyph, { color: palette.text }]}
      >
        ⚙
      </Text>
    </Pressable>
  );
}
