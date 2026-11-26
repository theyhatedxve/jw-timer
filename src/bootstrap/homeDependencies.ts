import { createHomeService } from '../backend/services/homeService';

import { meetingService } from './meetingDependencies';
import { profileService } from './profileDependencies';

export const homeService = createHomeService({
  meetings: meetingService,
  profiles: profileService,
});
