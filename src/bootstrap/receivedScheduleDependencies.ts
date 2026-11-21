import { createReceivedScheduleReader } from '../backend/services/receivedScheduleReader';
import { deviceRequestService } from './deviceRequestDependencies';
import { createLanService } from './lanProbeDependencies';
import { createSyncService } from './syncDependencies';

export function createReceivedScheduleReaderService() {
  const reader = createLanService();
  const published = createSyncService();

  return createReceivedScheduleReader(
    deviceRequestService,
    {
      loadReceived: async fingerprint =>
        await published.readPublished(fingerprint) ?? await reader.loadReceived(fingerprint),
    },
  );
}
