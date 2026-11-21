import { requireOptionalNativeModule } from 'expo';

import { PairingFailure } from '../domain/devices/deviceInvitation';
import {
  pairingPayload,
  type PairingBody,
  type PairingPacket,
} from '../domain/devices/signedPairing';

interface NativePairing {
  newPairingNonce(): Promise<unknown>;
  signPairingProof(payload: string): Promise<unknown>;
  verifyPairingProof(
    payload: string,
    signature: string,
  ): Promise<unknown>;
}

function native(): NativePairing {
  const module =
    requireOptionalNativeModule<NativePairing>('DeviceIdentity');

  if (!module) throw new PairingFailure('identity');
  return module;
}

export const pairingCrypto = {
  async nonce(): Promise<string> {
    const value = await native().newPairingNonce();

    if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) {
      throw new PairingFailure('invalid');
    }

    return value;
  },

  async sign(body: PairingBody): Promise<string> {
    const value = await native().signPairingProof(
      pairingPayload(body),
    );

    if (typeof value !== 'string') {
      throw new PairingFailure('invalid');
    }

    return value;
  },

  async verify(packet: PairingPacket): Promise<boolean> {
    return await native().verifyPairingProof(
      pairingPayload(packet),
      packet.signature,
    ) === true;
  },
};
