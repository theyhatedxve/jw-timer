import { fullscreenTimerRepository } from '../backend/database/repositories/fullscreenTimerRepository';
import { createFullscreenTimerService } from '../backend/services/fullscreenTimerService';

export const fullscreenTimerService = createFullscreenTimerService(fullscreenTimerRepository);
