export const deviceIdentityEn = {
  title: 'Device identity',
  description:
    'Create this installation’s identity for future device pairing. Its private key stays in Android Keystore and is excluded from backups.',
  missing: 'No device identity has been created.',
  create: 'Create device identity',
  refresh: 'Refresh identity',
  fingerprint: 'Public-key fingerprint',
  check: 'Check local signing',
  verified: 'Local signing check passed.',
  busy: 'Reading or checking device identity...',
  wait: 'Wait for the identity operation to finish.',
  protection: {
    tee: 'Hardware-backed storage: TEE',
    strongbox: 'Hardware-backed storage: StrongBox',
    hardware: 'Hardware-backed storage',
  },
  errors: {
    native: 'Rebuild and install the app to enable device identity.',
    keystore:
      'The identity could not be accessed or its hardware protection could not be verified. The existing key was not replaced.',
    invalid: 'The native identity response could not be validated.',
    verification: 'The local signing check failed.',
  },
} as const;