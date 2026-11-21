import { localAssignmentRepository } from '../backend/database/repositories/assignmentRepository';
import { createScheduleService } from '../backend/services/scheduleService';
import { meetingService } from './meetingDependencies';
import { publisherService } from './publisherDependencies';

export const scheduleService = createScheduleService(
  meetingService, publisherService, localAssignmentRepository,
);
