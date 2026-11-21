import { createHomeService } from '../backend/services/homeService';

import { meetingService } from './meetingDependencies';
import { meetingDutyService } from './meetingDutyDependencies';
import { profileService } from './profileDependencies';

export const homeService = createHomeService({
  meetings: meetingService,
  duties: meetingDutyService,
  profiles: profileService,
});