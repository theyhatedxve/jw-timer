export const deviceRequestsEn = {
  title: 'Device requests',
  description:
    'Pending requests are unverified. They cannot read or publish schedules. Signed proof and mutual confirmation come next.',
  own: 'This device’s public invitation',
  label: 'Other device’s label',
  invitation: 'Paste the other device’s invitation',
  add: 'Add pending request',
  refresh: 'Refresh',
  revoke: 'Revoke request',
  pending: 'Pending — not trusted',
  revoked: 'Revoked',
  wait: 'Wait for the current operation to finish.',
  errors: {
    invalid: 'Check the device label and invitation.',
    identity:
      'Create a working device identity first. If the native module changed, rebuild the app. An existing registry cannot be rebound automatically.',
    ownDevice: 'This invitation belongs to this device.',
    duplicate: 'This device already has a request record.',
    storage: 'The device requests could not be read or saved.',
  },
} as const;