export function isDeviceFingerprint(value: unknown): value is string {
  return typeof value === 'string' &&
    /^sha256:[a-f0-9]{64}$/.test(value);
}
