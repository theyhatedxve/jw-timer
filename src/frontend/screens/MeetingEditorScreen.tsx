import type {
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

import MeetingEditorView from '../components/meetings/MeetingEditorView';
import { useMeetingEditor } from '../hooks/useMeetingEditor';
import { meetingService } from '../../bootstrap/meetingDependencies';

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
    route.params?.importDraft,
  );

  return <MeetingEditorView {...model} />;
}
