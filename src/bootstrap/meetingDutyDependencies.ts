import {
  localMeetingDutyRepository,
} from '../backend/database/repositories/meetingDutyRepository';

import {
  createMeetingDutyService,
} from '../backend/services/meetingDutyService';

export const meetingDutyService = createMeetingDutyService(
  localMeetingDutyRepository,
);