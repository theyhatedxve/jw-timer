import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AssignmentEditorView from '../components/assignments/AssignmentEditorView';
import { useAssignmentEditor } from '../hooks/useAssignmentEditor';
import { scheduleService } from '../../bootstrap/scheduleDependencies';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AssignmentEditor'>;

export default function AssignmentEditorScreen({ route }: Props) {
  const model = useAssignmentEditor(
    scheduleService, route.params.meetingId, route.params.partId, route.params.role,
  );
  return <AssignmentEditorView {...model} />;
}
