import { useRoute } from '@react-navigation/native';
import { Alert } from 'react-native';

import { appResetEn } from '../../constants/strings/appResetEn';

import { appearanceEn } from '../../constants/strings/appearanceEn';
import { PROFILE_TEXT } from '../../constants/strings/profileEn';

import SettingsView from '../components/settings/SettingsView';
import { useAppTheme } from '../context/AppearanceContext';
import { useAppReset } from '../context/AppResetContext';
import { useLocalProfile } from '../hooks/useLocalProfile';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function SettingsScreen() {
  const model = useSectionScreen('settings');
  const requestReset = useAppReset();
  const confirmReset = () => Alert.alert(
    appResetEn.confirmTitle,
    appResetEn.confirmMessage,
    [
      { text: appResetEn.cancel, style: 'cancel' },
      { text: appResetEn.title, style: 'destructive', onPress: requestReset },
    ],
    { cancelable: true },
  );
  const route = useRoute();
  const { preference } = useAppTheme();
  const { state } = useLocalProfile();
  const language = state.status === 'ready'
    ? state.profile?.programLanguage
    : undefined;

  return (
    <SettingsView
      actions={[...model.actions, { id: 'reset-app', label: appResetEn.title, onPress: confirmReset }]}
      hasNavigationHeader={route.name === 'Settings'}
      values={{
        appearance: appearanceEn.options[preference],
        profile: language === undefined
          ? undefined
          : language === 'war' ? PROFILE_TEXT.waray : PROFILE_TEXT.english,
      }}
    />
  );
}
