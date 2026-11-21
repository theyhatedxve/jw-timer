export const devicePermissionsEn = {
  title: 'Device permissions',
  refresh: 'Refresh permissions',
  grant: 'Grant read-only schedule access',
  disable: 'Disable schedule access',
  cancel: 'Cancel',
  confirm: 'Grant access',
  allowed: 'Read-only schedule access is enabled.',
  denied: 'Schedule access is denied.',
  scope:
    'Applies to this congregation’s meeting programs and duty assignments. Access lasts until revoked. Editing, publishing, and device management stay denied.',
  untrusted: 'Complete signed pairing before granting access.',
  loading: 'Loading permissions...',
  wait: 'Wait for the permission operation to finish.',
  confirmMessage: (device: string, congregation: string): string =>
    `Allow "${device}" to read schedules for "${congregation}"?`,
  errors: {
    invalid: 'Invalid permission request.',
    identity: 'A working device identity is required.',
    profile: 'The congregation profile could not be loaded.',
    peer: 'This device request is unavailable.',
    conflict: 'The profile, device, or grant changed. Refresh first.',
    denied: 'This operation is not permitted.',
    storage: 'Permissions could not be read or saved.',
  },
} as const;