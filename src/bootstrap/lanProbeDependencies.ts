import { createLanProbeService } from '../backend/services/lanProbeService';
import { deviceRequestRepository } from '../backend/database/repositories/deviceRequestRepository';
import { peerIdentityNative } from '../backend/security/peerIdentityNative';
import { lanProbeNative } from '../backend/network/lanProbeNative';
import { deviceIdentityService } from './deviceIdentityDependencies';
import { devicePermissionService } from './devicePermissionDependencies';
import { profileService } from './profileDependencies';

export function createLanService() {
  return createLanProbeService(
    deviceIdentityService, profileService, deviceRequestRepository,
    peerIdentityNative, devicePermissionService, lanProbeNative,
  );
}
