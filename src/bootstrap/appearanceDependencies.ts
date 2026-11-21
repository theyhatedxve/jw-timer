import { createAppearanceService } from '../backend/services/appearanceService';
import { appearanceRepository } from '../backend/database/repositories/appearanceRepository';

export const appearanceService =
  createAppearanceService(appearanceRepository);
