import MeetingsListView from '../components/meetings/MeetingsListView';
import ProfileSetupPrompt from '../components/onboarding/ProfileSetupPrompt';
import { useLocalProfile } from '../hooks/useLocalProfile';
import { meetingProgramsEn } from '../../constants/strings/meetingProgramsEn';
import { useMeetings } from '../hooks/useMeetings';
import { meetingService } from '../../bootstrap/meetingDependencies';
import { createOnlineWorkbookImporter } from '../../backend/services/onlineWorkbookImport';
import { loadCurrentWolProgram } from '../../backend/online/wolProgramSource';

const importProgram = createOnlineWorkbookImporter(meetingService, loadCurrentWolProgram);

export default function MeetingsScreen() {
  const model = useMeetings(meetingService, importProgram);
  const { state } = useLocalProfile();
  if (state.status === 'ready' && !state.profile) {
    return <ProfileSetupPrompt title={meetingProgramsEn.screenTitle} />;
  }

  return <MeetingsListView {...model} />;
}