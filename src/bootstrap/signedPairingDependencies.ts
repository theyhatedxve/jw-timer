import { createSignedPairingService } from '../backend/services/signedPairingService';
import { deviceIdentityService } from './deviceIdentityDependencies';
import { deviceRequestRepository } from '../backend/database/repositories/deviceRequestRepository';
import { pairingTrustRepository } from '../backend/database/repositories/pairingTrustRepository';
import { peerIdentityNative } from '../backend/security/peerIdentityNative';
import { pairingCrypto } from '../backend/security/pairingCrypto';

export function createPairingService() {
  return createSignedPairingService(
    deviceIdentityService,
    deviceRequestRepository,
    peerIdentityNative,
    pairingCrypto,
    pairingTrustRepository,
  );
}
