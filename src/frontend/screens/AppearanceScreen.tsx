import { Text } from 'react-native';

import { APPEARANCE_OPTIONS } from '../../backend/services/appearanceService';
import { appearanceEn as text } from '../../constants/strings/appearanceEn';
import { useAppTheme } from '../context/AppearanceContext';
import AppButton from '../components/common/AppButton';
import AppCard from '../components/common/AppCard';
import AppScreen from '../components/common/AppScreen';

export default function AppearanceScreen() {
  const model = useAppTheme();

  const message = model.notice === 'saved'
    ? text.saved
    : model.notice === 'load'
      ? text.loadError
      : model.notice === 'save'
        ? text.saveError
        : null;

  return (
    <AppScreen>
      <Text accessibilityRole="header" className="text-app-title font-bold text-app-text">
        {text.title}
      </Text>

      <Text className="text-app-body text-app-secondary">
        {text.description}
      </Text>

      <AppCard>
        {APPEARANCE_OPTIONS.map(option => (
          <AppButton
            key={option}
            label={
              text.options[option] +
              (model.preference === option ? text.selected : '')
            }
            selected={model.preference === option}
            onPress={() => model.choose(option)}
          />
        ))}
      </AppCard>

      {message ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole={model.notice === 'saved' ? undefined : 'alert'}
          className={
            model.notice === 'saved'
              ? 'text-app-body text-app-text'
              : 'text-app-body text-app-danger'
          }
        >
          {message}
        </Text>
      ) : null}

      {model.notice === 'load' || model.notice === 'save' ? (
        <AppButton label={text.retry} onPress={model.reload} />
      ) : null}

      <Text className="text-app-body text-app-secondary">
        {text.partial}
      </Text>
    </AppScreen>
  );
}
