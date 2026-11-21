import { isCongregationId } from '../profile/profile';
import { isDeviceFingerprint } from './devicePermissions';

export interface LanConnection {
  readonly version: 1;
  readonly host: string;
  readonly port: 49373;
  readonly congregationId: string;
  readonly fingerprint: string;
}

export function isPrivateIpv4(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split('.');
  if (parts.length !== 4 || parts.some(part =>
    !/^\d{1,3}$/.test(part) || Number(part) > 255 ||
    String(Number(part)) !== part,
  )) return false;
  const first = Number(parts[0]);
  const second = Number(parts[1]);
  return first === 10 || (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

export function parseLanConnection(serialized: string): LanConnection {
  if (serialized.length > 512) throw new Error('Invalid LAN connection code');
  const input: unknown = JSON.parse(serialized);
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new Error('Invalid LAN connection code');
  }
  const value = input as Record<string, unknown>;
  if (Object.keys(value).sort().join(',') !== 'congregationId,fingerprint,host,port,version' ||
    value.version !== 1 || !isPrivateIpv4(value.host) || value.port !== 49373 ||
    !isCongregationId(value.congregationId) || !isDeviceFingerprint(value.fingerprint)) {
    throw new Error('Invalid LAN connection code');
  }
  return {
    version: 1, host: value.host, port: 49373,
    congregationId: value.congregationId, fingerprint: value.fingerprint,
  };
}
