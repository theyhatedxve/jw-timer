import SectionView from '../components/common/SectionView';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function HomeScreen() {
  const model = useSectionScreen('home');
  return <SectionView {...model} />;
}
