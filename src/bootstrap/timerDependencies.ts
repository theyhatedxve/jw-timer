import {
  timerCheckpointRepository,
} from '../backend/database/repositories/timerStorage';

import {
  createTimerSessionService,
} from '../backend/services/timerSessionService';

import { meetingService } from './meetingDependencies';

export const timerSessionService =
  createTimerSessionService(
    meetingService,
    timerCheckpointRepository,
  );