import SectionView from '../components/common/SectionView';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function SettingsScreen() {
  const model = useSectionScreen('settings');
  return <SectionView {...model} />;
}
