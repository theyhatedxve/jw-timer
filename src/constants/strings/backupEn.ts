export const backupEn = {
  title: 'Backup and restore',
  password: 'Backup password',
  confirmation: 'Repeat password for export',
  export: 'Export encrypted backup',
  preview: 'Select backup and preview',
  restore: 'Restore this backup',
  cancel: 'Cancel',
  replace: 'Replace current data',
  restart: 'Restart app',
  wait: 'Wait for the current operation to finish.',
  saved: 'Encrypted backup saved.',
  restored: 'Backup restored. Restart the app to load the restored data.',
  guidance:
    'Use a long, unique password of 12–128 characters. Lost passwords cannot be recovered. Choose local storage; selected storage apps may sync files online.',
  replacement:
    'Restore replaces the current profile, meetings, publishers, and assignments. Current records absent from the backup will be removed.',
  summary: (
    meetings: number,
    publishers: number,
    assignments: number,
    historicalRows: number,
  ): string =>
    `${meetings} meetings\n${publishers} publishers\n` +
    `${assignments} assigned duties\n${historicalRows} historical rows`,
  errors: {
    invalid:
      'Backup operation failed. Check the password, file, available storage, and app version.',
    changed:
      'Current data changed after the preview. Select the backup and preview it again.',
    password:
      'Use 12–128 characters. For export, both password fields must match.',
    native:
      'Backup encryption is unavailable. Rebuild and install the app.',
  },
} as const;