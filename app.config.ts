import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'JW Timer Prototype',
  slug: 'jw-timer-phase-0',
  version: '0.0.1',
  scheme: 'jwtimer-prototype',
  platforms: ['android'],
  orientation: 'default',
  userInterfaceStyle: 'automatic',
  updates: { enabled: false },
  android: {
    package: 'com.jwtimer.feasibility',
    versionCode: 1,
    // Avoid Android's automatic cloud backup for the local prototype database.
    allowBackup: false,
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  plugins: [
    'expo-sqlite',
    ['expo-dev-client', { launchMode: 'most-recent' }],
  ],
};

export default config;
