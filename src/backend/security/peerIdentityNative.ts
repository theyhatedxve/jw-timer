import { requireOptionalNativeModule } from 'expo';
import { PairingFailure } from '../domain/devices/deviceInvitation';

interface NativeIdentity {
  inspectPeerPublicKey(publicKey: string): Promise<unknown>;
}

export const peerIdentityNative = {
  inspect(publicKey: string): Promise<unknown> {
    const native =
      requireOptionalNativeModule<NativeIdentity>('DeviceIdentity');

    if (!native) throw new PairingFailure('identity');

    return native.inspectPeerPublicKey(publicKey);
  },
};