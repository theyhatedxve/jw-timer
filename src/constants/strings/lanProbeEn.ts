export const lanProbeEn = {
  title: 'LAN session check',
  instructions:
    'Connect both phones to the same private Wi-Fi. Choose one phone to host. Prepare and share its connection code before starting the listener.',
  prepare: 'Prepare connection code',
  start: 'Start hosting',
  stop: 'Stop hosting',
  hosting: 'Hosting for up to five minutes. Keep this screen open.',
  stopped: 'Hosting stopped.',
  code: 'This phone’s connection code',
  incoming: 'Paste the hosting phone’s connection code',
  connect: 'Check encrypted connection',
  protocol: 'Check native protocol validation',
  protocolPassed: 'Wrong nonce, wrong scope, and unsupported version were rejected.',
  accepted: 'Encrypted identities verified. Read permission accepted.',
  denied: 'Connection denied by the other phone’s permission policy.',
  wait: 'Wait for the current operation to finish.',
  failed:
    'The connection could not be checked. Verify pairing, read permissions, Wi-Fi, and the pasted code. Rebuild if native methods are unavailable.',
  scope:
    'Download programs and the four duty assignments. Preview before saving a separate read-only copy. Local programs and publishers remain unchanged. Hosting stops when you leave this screen or background the app.',
  download: 'Download schedule preview',
  saveReceived: 'Save received copy',
  loadReceived: 'Open saved received copy',
  preview: 'Received schedule',
  previewReady: 'Downloaded for review. Nothing has been saved.',
  saved: 'Received copy saved locally.',
  savedCopy: 'Showing the saved offline copy.',
  noSavedCopy: 'No received copy has been saved for this device.',
  emptySchedule: 'This received schedule contains no meetings.',
  saveQuestion:
    'Save this preview? It replaces the previously received copy from this device for your current local profile.',
  cancel: 'Cancel',
} as const;
