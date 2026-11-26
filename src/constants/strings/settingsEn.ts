export const settingsEn = {
  title: 'Settings',
  description: 'Appearance, local meeting programs, and backups.',
  chevron: '›',
  groups: {
    general: 'General',
    programs: 'Programs',
    backups: 'Backups',
    diagnostics: 'Diagnostics',
    other: 'Other tools',
  },
  descriptions: {
    appearance: 'System, light, or dark appearance',
    profile: 'Congregation name, time zone, and program language',
    'workbook-import': 'Import a workbook PDF stored on this device',
    backups: 'Export or restore an encrypted local backup',
    diagnostics: 'Run local SQLite storage checks',
    'backup-checks': 'Check backup recovery behavior',
    'nativewind-preview': 'Preview development styling',
  },
} as const;
