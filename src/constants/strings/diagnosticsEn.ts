export const diagnosticsEn = {
  title: 'SQLite checks',
  description:
    'Runs only when requested. Uses synthetic records in a separate disposable database; the saved timer checkpoint is not opened.',
  run: 'Run SQLite checks',
  running: 'Running checks…',
  passed: 'All reported checks passed.',
  failed: 'A check failed. Report the details below.',
  limitation:
    'These checks exercise native SQLite behavior. They do not prove production migrations, power-loss recovery, disk-full handling, or encrypted backups.',
  back: 'Back',
  pass: 'PASS',
  fail: 'FAIL',
} as const;
