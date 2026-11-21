import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import MeetingDutiesView from '../components/assignments/MeetingDutiesView';
import { useMeetingDuties } from '../hooks/useMeetingDuties';

import { meetingService } from '../../bootstrap/meetingDependencies';
import { publisherService } from '../../bootstrap/publisherDependencies';
import { meetingDutyService } from '../../bootstrap/meetingDutyDependencies';

import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<
  RootStackParamList,
  'MeetingDuties'
>;

export default function MeetingDutiesScreen({ route }: Props) {
  const model = useMeetingDuties(
    meetingService,
    publisherService,
    meetingDutyService,
    route.params.meetingId,
  );

  return <MeetingDutiesView {...model} />;
}