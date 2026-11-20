import SectionView from '../components/common/SectionView';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function MeetingsScreen() {
  const model = useSectionScreen('meetings');
  return <SectionView {...model} />;
}
