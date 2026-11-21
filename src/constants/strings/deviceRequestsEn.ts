export const deviceRequestsEn = {
  title: 'Device requests',
  description:
    'Add a request, then exchange signed proofs on both phones. Identity trust grants no schedule permissions.',
  pair: 'Start signed pairing',
  trusted: 'Trusted identity',
  requestAgain: 'Create a new pending request',
  own: 'This device’s public invitation',
  label: 'Other device’s label',
  invitation: 'Paste the other device’s invitation',
  add: 'Add pending request',
  refresh: 'Refresh',
  revoke: 'Revoke request',
  pending: 'Pending — not trusted',
  revoked: 'Revoked',
  wait: 'Wait for the current operation to finish.',
  permissions: 'Schedule permissions',
  lan: 'LAN session check',
  errors: {
    invalid: 'Check the device label and invitation.',
    identity:
      'Create a working device identity first. If the native module changed, rebuild the app. An existing registry cannot be rebound automatically.',
    ownDevice: 'This invitation belongs to this device.',
    duplicate: 'This device already has a request record.',
    storage: 'The device requests could not be read or saved.',
  },
} as const;
