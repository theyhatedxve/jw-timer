import MeetingsListView from '../components/meetings/MeetingsListView';
import { useMeetings } from '../hooks/useMeetings';
import { meetingService } from '../../bootstrap/meetingDependencies';

export default function MeetingsScreen() {
  const model = useMeetings(meetingService);

  return <MeetingsListView {...model} />;
}