import { requireOptionalNativeModule } from 'expo';

import { DeviceIdentityFailure } from '../domain/devices/deviceIdentity';
import type { DeviceIdentityPort } from '../services/deviceIdentityService';

interface NativeIdentity {
  readIdentity(): Promise<unknown>;
  createIdentity(): Promise<unknown>;
  checkIdentity(): Promise<unknown>;
}

function native(): NativeIdentity {
  const module =
    requireOptionalNativeModule<NativeIdentity>('DeviceIdentity');

  if (!module) throw new DeviceIdentityFailure('native');
  return module;
}

export const deviceIdentityNative: DeviceIdentityPort = {
  read: () => native().readIdentity(),
  create: () => native().createIdentity(),
  check: () => native().checkIdentity(),
};