import { createDevicePermissionService } from '../backend/services/devicePermissionService';
import { deviceIdentityService } from './deviceIdentityDependencies';
import { profileService } from './profileDependencies';
import { deviceRequestRepository } from '../backend/database/repositories/deviceRequestRepository';
import { devicePermissionRepository } from '../backend/database/repositories/devicePermissionRepository';

export const devicePermissionService =
  createDevicePermissionService(
    deviceIdentityService,
    profileService,
    deviceRequestRepository,
    devicePermissionRepository,
  );