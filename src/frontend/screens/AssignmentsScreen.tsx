import SectionView from '../components/common/SectionView';
import { useSectionScreen } from '../hooks/useSectionScreen';

export default function AssignmentsScreen() {
  const model = useSectionScreen('assignments');
  return <SectionView {...model} />;
}
