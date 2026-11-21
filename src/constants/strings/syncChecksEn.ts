export const syncChecksEn = {
  title: 'Sync storage checks',
  description: 'Uses synthetic records in an isolated in-memory database. Your saved database and network are not opened.',
  run: 'Run sync storage checks', running: 'Running storage checks...',
  passed: 'All reported storage checks passed.', failed: 'A storage check failed. Report its name and details.',
  wait: 'Wait for the storage checks to finish.',
  limitation: 'These checks cover migrations, transactions and restore isolation. Synthetic proof fields are used; real signing, discovery, camera and two-phone exchange still need device checks.',
} as const;
