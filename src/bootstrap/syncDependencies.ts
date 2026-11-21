import { createSyncService as createService } from '../backend/services/syncService';
import { syncRepository } from '../backend/database/repositories/syncRepository';
import { captureSyncDataset } from '../backend/database/repositories/syncSourceRepository';
import { deviceRequestRepository } from '../backend/database/repositories/deviceRequestRepository';
import { peerIdentityNative } from '../backend/security/peerIdentityNative';
import { syncCryptoNative } from '../backend/security/syncCryptoNative';
import { lanProbeNative } from '../backend/network/lanProbeNative';
import { deviceIdentityService } from './deviceIdentityDependencies';
import { profileService } from './profileDependencies';
import { devicePermissionService } from './devicePermissionDependencies';
import { SyncFailure } from '../backend/domain/sync/syncTypes';

export function createSyncService() {
  let activeClient: string | null = null;
  let generation = 0;
  return createService({
    identities: deviceIdentityService, profiles: profileService, peers: deviceRequestRepository,
    inspector: peerIdentityNative, permissions: devicePermissionService, store: syncRepository,
    capture: captureSyncDataset, crypto: syncCryptoNative,
    request: async (key, code, body) => {
      const expected = generation;
      const id = await lanProbeNative.token();
      if (generation !== expected) throw new SyncFailure('CANCELLED');
      activeClient = id;
      try { return await lanProbeNative.probe(key, code, 'sync.exchange', body, id); }
      finally { if (activeClient === id) activeClient = null; }
    },
    stop: async () => {
      generation++;
      const id = activeClient;
      activeClient = null;
      if (id) await lanProbeNative.cancelClient(id);
    },
  });
}
