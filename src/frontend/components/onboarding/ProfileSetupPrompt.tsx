import { useNavigation } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onboardingEn as text } from '../../../constants/strings/onboardingEn';
import { spacing } from '../../../constants/theme';
import { useAppTheme } from '../../context/AppearanceContext';
import AppButton from '../common/AppButton';
import AppIcon from '../common/AppIcon';
import AppScreen from '../common/AppScreen';

export default function ProfileSetupPrompt({ title }: { readonly title: string }) {
  const navigation = useNavigation();
  const { palette } = useAppTheme();
  return (
    <SafeAreaView className="flex-1 bg-app-canvas" edges={['top', 'left', 'right']}>
      <AppScreen>
        <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">{title}</Text>
        <View className="gap-app-medium py-app-large">
          <AppIcon name="meetings" color={palette.brand} size={spacing.large * 2} />
          <Text accessibilityRole="header" className="text-xl font-bold text-app-text">{text.setupRequiredTitle}</Text>
          <Text className="text-app-body leading-7 text-app-secondary">{text.setupRequiredBody}</Text>
          <AppButton label={text.setup} onPress={() => navigation.navigate('EditProfile')} />
        </View>
      </AppScreen>
    </SafeAreaView>
  );
}
