export const codeExchangeEn = {
  show: 'Show QR code', hide: 'Hide QR code', scan: 'Scan QR code', close: 'Close scanner',
  permission: 'Camera access is needed to scan a QR code. You can still paste the code manually.',
  failed: 'The camera could not open. Paste the code manually.', invalid: 'This QR code is too long or empty. Paste a valid code manually.',
  instruction: 'Scanning only fills the text field. Compare fingerprints and use the existing review and approval buttons.',
  find: 'Find LAN hosts', stop: 'Stop discovery', finding: 'Looking for LAN hosts…',
  discovered: 'Unverified LAN announcements. Select one to fill the connection code; this does not establish trust.',
  discoveryFailed: 'LAN discovery is unavailable. Paste or scan a connection code.',
  discoveryRestart: 'Discovery could not release an Android resolver. Restart the app, or paste or scan a connection code.',
  choose: 'Use this connection code', empty: 'No matching LAN announcements yet.',
} as const;
