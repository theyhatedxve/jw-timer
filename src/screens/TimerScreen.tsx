import SectionView from '../components/common/SectionView';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function TimerScreen() {
  const model = useSectionScreen('timer');
  return <SectionView {...model} />;
}
