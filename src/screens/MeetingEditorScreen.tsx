import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import MeetingEditorView from '../components/meetings/MeetingEditorView';
import { useMeetingEditor } from '../hooks/useMeetingEditor';
import { meetingService } from '../state/meetings/meetingDependencies';

import type {
  RootStackParamList,
} from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MeetingEditor'
>;

export default function MeetingEditorScreen({ route }: Props) {
  const model = useMeetingEditor(
    meetingService,
    route.params?.meetingId,
  );

  return <MeetingEditorView {...model} />;
}