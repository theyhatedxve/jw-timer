import { createHomeService } from '../backend/services/homeService';

import { meetingService } from './meetingDependencies';
import { profileService } from './profileDependencies';
import { timerSessionService } from './timerDependencies';

export const homeService = createHomeService({
  meetings: meetingService,
  profiles: profileService,
  sessions: timerSessionService,
});
