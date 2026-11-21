import { createProfileService } from '../backend/services/profileService';
import { localProfileRepository } from '../backend/database/repositories/profileRepository';

export const profileService = createProfileService(
  localProfileRepository,
);