import { createDeviceIdentityService } from '../backend/services/deviceIdentityService';
import { deviceIdentityNative } from '../backend/security/deviceIdentityNative';

export const deviceIdentityService =
  createDeviceIdentityService(deviceIdentityNative);