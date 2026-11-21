import { useNavigation } from '@react-navigation/native';

import DutyOverviewView from '../components/assignments/DutyOverviewView';
import { useDutyOverview } from '../hooks/useDutyOverview';
import { meetingService } from '../../bootstrap/meetingDependencies';
import { publisherService } from '../../bootstrap/publisherDependencies';
import { meetingDutyService } from '../../bootstrap/meetingDutyDependencies';

export default function AssignmentsScreen() {
  const navigation = useNavigation();

  const model = useDutyOverview(
    meetingService,
    publisherService,
    meetingDutyService,
  );

  return (
    <DutyOverviewView
      {...model}
      onReceived={() =>
        navigation.navigate('ReceivedSchedules')
      }
    />
  );
}