export const signedPairingEn = {
  title: 'Signed device pairing',
  instructions:
    'On both phones: Start, exchange challenges, compare fingerprints, approve, then exchange approvals. Finish within five minutes.',
  start: 'Start new challenge',
  receive: 'Verify pasted message',
  approve: 'Compare fingerprints and approve',
  incoming: 'Paste the other phone’s challenge or approval',
  ownFingerprint: 'This phone',
  peerFingerprint: 'Other phone',
  challenge: 'Send this challenge',
  approval: 'Send this approval',
  confirm: 'Fingerprints match',
  cancel: 'Cancel',
  compare:
    'Compare both full fingerprints with the identity screens on the two phones. Approve only if both match.',
  failed:
    'Pairing failed, expired, or was replayed. Start fresh challenges on both phones. After repeated attempts, wait one minute. Ensure both clocks are correct and both apps are rebuilt.',
  wait: 'Wait for verification to finish.',
  status: {
    idle: 'Start on both phones.',
    challenge: 'Exchange and verify both challenges.',
    review: 'Compare fingerprints before approving.',
    approval: 'Exchange and verify both signed approvals.',
    trusted:
      'Local identity trust recorded. Deliver your approval and confirm the other phone also finishes. No schedule permissions have been granted.',
  },
} as const;
