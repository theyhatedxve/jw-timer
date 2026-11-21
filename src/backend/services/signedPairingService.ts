import type { DeviceIdentityService } from './deviceIdentityService';
import type { DeviceIdentity } from '../domain/devices/deviceIdentity';

import {
  PairingFailure,
  type DeviceRequest,
} from '../domain/devices/deviceInvitation';

import {
  PAIRING_TTL,
  parsePairingPacket,
  type PairingBody,
  type PairingPacket,
} from '../domain/devices/signedPairing';

interface Crypto {
  nonce(): Promise<string>;
  sign(body: PairingBody): Promise<string>;
  verify(packet: PairingPacket): Promise<boolean>;
}

interface Store {
  reserve(
    owner: string,
    peer: string,
    revision: number,
    nonce: string,
    expiresAt: number,
  ): void;
  cancel(owner: string, nonce: string): void;
  complete(
    owner: string,
    peer: string,
    nonce: string,
    peerNonce: string,
    expiresAt: number,
  ): void;
}

interface Session {
  readonly own: DeviceIdentity;
  readonly peer: DeviceRequest;
  readonly challenge: PairingPacket;
  peerChallenge?: PairingPacket;
  approval?: PairingPacket;
  trusted: boolean;
}

export interface PairingSnapshot {
  readonly phase: 'idle' | 'challenge' | 'review' | 'approval' | 'trusted';
  readonly ownFingerprint: string;
  readonly peerFingerprint: string;
  readonly challenge: string;
  readonly approval: string;
  readonly expiresAt: number;
}

export function createSignedPairingService(
  identities: DeviceIdentityService,
  requests: { list(owner: string): readonly DeviceRequest[] },
  inspector: { inspect(publicKey: string): Promise<unknown> },
  crypto: Crypto,
  store: Store,
  now: () => number = Date.now,
) {
  let session: Session | null = null;
  let generation = 0;
  let busy = false;

  function invalid(): never {
    throw new PairingFailure('invalid');
  }

  function cancel() {
    const previous = session;
    session = null;
    generation += 1;

    if (previous) {
      try {
        store.cancel(
          previous.own.fingerprint,
          previous.challenge.nonce,
        );
      } catch {
        // The in-memory challenge is already discarded.
      }
    }
  }

  function active(): Session {
    if (
      !session ||
      session.challenge.expiresAt <= now() ||
      (
        session.peerChallenge !== undefined &&
        session.peerChallenge.expiresAt <= now()
      )
    ) {
      invalid();
    }

    return session;
  }

  function still(current: Session) {
    if (session !== current) invalid();
    active();
  }

  async function perform(action: () => Promise<void>) {
    if (busy) invalid();

    busy = true;

    try {
      await action();
    } catch {
      cancel();
      throw new PairingFailure('invalid');
    } finally {
      busy = false;
    }
  }

  return {
    cancel,

    snapshot(): PairingSnapshot {
      const current = session;

      if (!current) {
        return {
          phase: 'idle',
          ownFingerprint: '',
          peerFingerprint: '',
          challenge: '',
          approval: '',
          expiresAt: 0,
        };
      }

      return {
        phase: current.trusted
          ? 'trusted'
          : current.approval
            ? 'approval'
            : current.peerChallenge
              ? 'review'
              : 'challenge',
        ownFingerprint: current.own.fingerprint,
        peerFingerprint: current.peer.fingerprint,
        challenge: JSON.stringify(current.challenge),
        approval: current.approval
          ? JSON.stringify(current.approval)
          : '',
        expiresAt: Math.min(
          current.challenge.expiresAt,
          current.peerChallenge?.expiresAt ??
            current.challenge.expiresAt,
        ),
      };
    },

    begin(fingerprint: string) {
      return perform(async () => {
        cancel();
        const requestGeneration = generation;
        const ownResult = await identities.read();

        if (!ownResult.ok || !ownResult.value) invalid();

        const own = ownResult.value;
        const peer = requests.list(own.fingerprint).find(
          request => request.fingerprint === fingerprint,
        );

        if (
          !peer ||
          peer.state !== 'pending' ||
          peer.fingerprint === own.fingerprint
        ) {
          invalid();
        }

        const inspected = await inspector.inspect(peer.publicKey);

        if (
          typeof inspected !== 'object' ||
          inspected === null ||
          !('publicKey' in inspected) ||
          !('fingerprint' in inspected) ||
          inspected.publicKey !== peer.publicKey ||
          inspected.fingerprint !== peer.fingerprint
        ) {
          invalid();
        }

        const body: PairingBody = {
          version: 1,
          type: 'challenge',
          from: own.publicKey,
          to: peer.publicKey,
          nonce: await crypto.nonce(),
          peerNonce: '',
          expiresAt: now() + PAIRING_TTL,
        };

        const challenge = parsePairingPacket(JSON.stringify({
          ...body,
          signature: await crypto.sign(body),
        }), now());

        if (generation !== requestGeneration) invalid();

        store.reserve(
          own.fingerprint,
          peer.fingerprint,
          peer.revision,
          challenge.nonce,
          challenge.expiresAt,
        );

        session = {
          own,
          peer,
          challenge,
          trusted: false,
        };
      });
    },

    receive(serialized: string) {
      return perform(async () => {
        const current = active();
        const packet = parsePairingPacket(serialized, now());

        if (
          current.trusted ||
          packet.from !== current.peer.publicKey ||
          packet.to !== current.own.publicKey ||
          packet.nonce === current.challenge.nonce
        ) {
          invalid();
        }

        if (packet.type === 'challenge') {
          if (current.peerChallenge || current.approval) invalid();
        } else {
          if (
            !current.peerChallenge ||
            !current.approval ||
            packet.nonce !== current.peerChallenge.nonce ||
            packet.peerNonce !== current.challenge.nonce ||
            packet.expiresAt !== current.approval.expiresAt
          ) {
            invalid();
          }
        }

        if (!await crypto.verify(packet)) invalid();
        still(current);

        if (packet.type === 'challenge') {
          current.peerChallenge = packet;
        } else {
          store.complete(
            current.own.fingerprint,
            current.peer.fingerprint,
            current.challenge.nonce,
            packet.nonce,
            packet.expiresAt,
          );

          current.trusted = true;
        }
      });
    },

    approve() {
      return perform(async () => {
        const current = active();

        if (
          !current.peerChallenge ||
          current.approval ||
          current.trusted
        ) {
          invalid();
        }

        const body: PairingBody = {
          version: 1,
          type: 'approval',
          from: current.own.publicKey,
          to: current.peer.publicKey,
          nonce: current.challenge.nonce,
          peerNonce: current.peerChallenge.nonce,
          expiresAt: Math.min(
            current.challenge.expiresAt,
            current.peerChallenge.expiresAt,
          ),
        };

        const approval = parsePairingPacket(JSON.stringify({
          ...body,
          signature: await crypto.sign(body),
        }), now());

        still(current);
        current.approval = approval;
      });
    },
  };
}

export type SignedPairingService =
  ReturnType<typeof createSignedPairingService>;
