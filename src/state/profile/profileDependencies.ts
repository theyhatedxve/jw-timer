import { createProfileService } from './profileService';
import { localProfileRepository } from './profileRepository';

export const profileService = createProfileService(
  localProfileRepository,
);