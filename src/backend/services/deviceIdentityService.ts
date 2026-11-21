import {
  DeviceIdentityFailure,
  parseIdentityReply,
  type IdentityCheckResult,
  type IdentityResult,
} from '../domain/devices/deviceIdentity';

export interface DeviceIdentityPort {
  read(): Promise<unknown>;
  create(): Promise<unknown>;
  check(): Promise<unknown>;
}

export function createDeviceIdentityService(
  native: DeviceIdentityPort,
) {
  async function load(
    operation: () => Promise<unknown>,
  ): Promise<IdentityResult> {
    try {
      return parseIdentityReply(await operation());
    } catch (error) {
      return {
        ok: false,
        code: error instanceof DeviceIdentityFailure
          ? error.code
          : 'keystore',
      };
    }
  }

  return {
    read: () => load(() => native.read()),
    create: () => load(() => native.create()),

    async check(): Promise<IdentityCheckResult> {
      try {
        return await native.check() === true
          ? { ok: true }
          : { ok: false, code: 'verification' };
      } catch (error) {
        return {
          ok: false,
          code: error instanceof DeviceIdentityFailure
            ? error.code
            : 'keystore',
        };
      }
    },
  };
}

export type DeviceIdentityService =
  ReturnType<typeof createDeviceIdentityService>;