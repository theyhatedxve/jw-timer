export const appearanceEn = {
  title: 'Appearance',
  description: 'Choose how the app looks on this device.',
  options: {
    system: 'System',
    light: 'Light',
    dark: 'Dark',
  },
  selected: ' (selected)',
  saved: 'Appearance saved.',
  loadError:
    'Saved appearance could not be loaded. Using System temporarily. Retry or choose an appearance.',
  saveError:
    'Appearance could not be saved. Your previous selection remains active.',
  retry: 'Reload saved appearance',
  partial:
    'Navigation and new components support both themes. Older screens will be updated in later steps.',
} as const;
