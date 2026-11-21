import { localMeetingRepository } from '../backend/database/repositories/meetingRepository';
import { createMeetingService } from '../backend/services/meetingService';

export const meetingService = createMeetingService(
  localMeetingRepository,
);
