import { deviceIdentityService } from './deviceIdentityDependencies';
import { deviceRequestRepository } from '../backend/database/repositories/deviceRequestRepository';
import { peerIdentityNative } from '../backend/security/peerIdentityNative';
import { createDeviceRequestService } from '../backend/services/deviceRequestService';

export const deviceRequestService = createDeviceRequestService(
  deviceIdentityService,
  deviceRequestRepository,
  peerIdentityNative,
);