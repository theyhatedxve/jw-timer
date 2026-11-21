export const backupChecksEn = {
  title: 'Backup recovery checks',
  description:
    'Uses synthetic records in an isolated in-memory database. Your saved database and backup files are not opened.',
  run: 'Run backup checks',
  running: 'Running backup checks...',
  wait: 'Wait for the checks to finish.',
  passed: 'All reported checks passed.',
  failed: 'A check failed. Report its name and details.',
  limitation:
    'These checks do not simulate sudden power loss or disk-full conditions.',
} as const;