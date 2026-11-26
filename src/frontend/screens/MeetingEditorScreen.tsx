import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeetingEditorView from '../components/meetings/MeetingEditorView';
import { useMeetingEditor } from '../hooks/useMeetingEditor';
import { meetingService } from '../../bootstrap/meetingDependencies';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MeetingEditor'>;

function ImportEditor({ route }: Props) {
  const model = useMeetingEditor(meetingService, undefined, route.params?.importDraft);
  return <MeetingEditorView {...model} />;
}

export default function MeetingEditorScreen(props: Props) {
  const meetingId = props.route.params?.meetingId;
  useEffect(() => {
    if (meetingId) {
      props.navigation.popTo('Main', {
        screen: 'Meetings',
        params: { meetingId, requestId: props.route.key },
      });
    }
  }, [meetingId, props.navigation, props.route.key]);

  return meetingId ? null : <ImportEditor {...props} />;
}
