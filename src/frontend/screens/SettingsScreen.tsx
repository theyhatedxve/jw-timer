import { appearanceEn } from '../../constants/strings/appearanceEn';
import { PROFILE_TEXT } from '../../constants/strings/profileEn';

import SettingsView from '../components/settings/SettingsView';
import { useAppTheme } from '../context/AppearanceContext';
import { useLocalProfile } from '../hooks/useLocalProfile';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function SettingsScreen() {
  const model = useSectionScreen('settings');
  const { preference } = useAppTheme();
  const { state } = useLocalProfile();
  const language = state.status === 'ready'
    ? state.profile?.programLanguage
    : undefined;

  return (
    <SettingsView
      actions={model.actions}
      values={{
        appearance: appearanceEn.options[preference],
        profile: language === undefined
          ? undefined
          : language === 'war' ? PROFILE_TEXT.waray : PROFILE_TEXT.english,
      }}
    />
  );
}
