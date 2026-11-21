import { requireOptionalNativeModule } from 'expo';
import { lanProbeNative } from '../network/lanProbeNative';
import { SyncFailure } from '../domain/sync/syncTypes';

interface NativeSyncProof {
  signSyncProof(body: string): Promise<unknown>;
  verifySyncProof(key: string, body: string, hash: string, signature: string): Promise<unknown>;
}
function native(): NativeSyncProof {
  const module = requireOptionalNativeModule<NativeSyncProof>('DeviceIdentity');
  if (!module) throw new SyncFailure('IDENTITY');
  return module;
}
export const syncCryptoNative = {
  token: () => lanProbeNative.token(),
  sign: (body: string) => native().signSyncProof(body),
  verify: async (key: string, body: string, hash: string, signature: string) =>
    await native().verifySyncProof(key, body, hash, signature) === true,
};
