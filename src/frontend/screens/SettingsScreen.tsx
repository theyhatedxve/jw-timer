import { appearanceEn } from '../../constants/strings/appearanceEn';

import SettingsView from '../components/settings/SettingsView';
import { useAppTheme } from '../context/AppearanceContext';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function SettingsScreen() {
  const model = useSectionScreen('settings');
  const { preference } = useAppTheme();

  return (
    <SettingsView
      actions={model.actions}
      appearanceLabel={appearanceEn.options[preference]}
    />
  );
}
