import { useState } from 'react';

import ReceivedSchedulesView from '../components/devices/ReceivedSchedulesView';
import { useReceivedSchedules } from '../hooks/useReceivedSchedules';
import { createReceivedScheduleReaderService } from '../../bootstrap/receivedScheduleDependencies';

export default function ReceivedSchedulesScreen() {
  const [service] = useState(
    createReceivedScheduleReaderService,
  );

  const model = useReceivedSchedules(service);

  return <ReceivedSchedulesView {...model} />;
}