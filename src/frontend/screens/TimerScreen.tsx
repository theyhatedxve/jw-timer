import { Text } from 'react-native';

import { dimensions } from '../../constants/theme';
import { timerPresentationEn as text } from '../../constants/strings/timerPresentationEn';

import { useAppTheme } from '../context/AppearanceContext';
import { useSectionScreen } from '../hooks/useSectionScreen';

import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import AppIcon from '../components/common/AppIcon';
import AppScreen from '../components/common/AppScreen';

export default function TimerScreen() {
  const { palette } = useAppTheme();
  const model = useSectionScreen('timer');

  return (
    <AppScreen>
      <AppIcon
        name="timer"
        color={palette.brand}
        size={dimensions.minimumTouchTarget}
      />

      <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
        {text.title}
      </Text>

      <Text className="text-app-body text-app-secondary">
        {text.entryDescription}
      </Text>

      <AppCard>
        {model.actions.map(action => (
          <AppButton
            key={action.id}
            label={action.label}
            onPress={action.onPress}
          />
        ))}
      </AppCard>

      <Text className="text-app-body text-app-secondary">
        {text.operationNote}
      </Text>
    </AppScreen>
  );
}
