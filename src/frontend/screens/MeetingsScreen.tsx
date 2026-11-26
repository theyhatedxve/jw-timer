import MeetingsListView from '../components/meetings/MeetingsListView';
import { useMeetings } from '../hooks/useMeetings';
import { meetingService } from '../../bootstrap/meetingDependencies';
import { createOnlineWorkbookImporter } from '../../backend/services/onlineWorkbookImport';
import { loadCurrentWolProgram } from '../../backend/online/wolProgramSource';

const importProgram = createOnlineWorkbookImporter(meetingService, loadCurrentWolProgram);

export default function MeetingsScreen() {
  const model = useMeetings(meetingService, importProgram);

  return <MeetingsListView {...model} />;
}