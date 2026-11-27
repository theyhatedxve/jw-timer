import { onboardingRepository } from '../backend/database/repositories/onboardingRepository';
import { createOnboardingService } from '../backend/services/onboardingService';

export const onboardingService = createOnboardingService(onboardingRepository);
