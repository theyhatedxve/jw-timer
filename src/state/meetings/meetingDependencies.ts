import { localMeetingRepository } from './meetingRepository';
import { createMeetingService } from './meetingService';

export const meetingService = createMeetingService(
  localMeetingRepository,
);
