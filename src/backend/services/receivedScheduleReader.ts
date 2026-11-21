import type { DeviceRequestService } from './deviceRequestService';
import type { LanProbeService } from './lanProbeService';
import { isDeviceFingerprint } from '../domain/devices/devicePermissions';

export interface ReceivedScheduleSource {
  readonly label: string;
  readonly fingerprint: string;
}

export function createReceivedScheduleReader(
  devices: Pick<DeviceRequestService, 'load'>,
  schedules: Pick<LanProbeService, 'loadReceived'>,
) {
  return {
    async list(): Promise<readonly ReceivedScheduleSource[]> {
      const result = await devices.load();

      return result.requests
        .filter(device => device.state === 'trusted')
        .map(device => ({
          label: device.label,
          fingerprint: device.fingerprint,
        }));
    },

    async open(fingerprint: string) {
      if (!isDeviceFingerprint(fingerprint)) {
        throw new Error('Invalid sending device');
      }

      const current = await devices.load();

      const source = current.requests.find(device =>
        device.fingerprint === fingerprint &&
        device.state === 'trusted',
      );

      if (!source) {
        throw new Error('Sending device is no longer trusted');
      }

      // The existing reader checks current trust and local profile scope.
      const schedule = await schedules.loadReceived(fingerprint);

      return {
        source: {
          label: source.label,
          fingerprint: source.fingerprint,
        },
        schedule,
      };
    },
  };
}

export type ReceivedScheduleReader =
  ReturnType<typeof createReceivedScheduleReader>;