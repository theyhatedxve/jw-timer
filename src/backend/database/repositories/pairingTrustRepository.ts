import { getDeviceTrustDatabase } from './deviceRequestRepository';
import { PairingFailure } from '../../domain/devices/deviceInvitation';

function invalid(): never {
  throw new PairingFailure('invalid');
}

export const pairingTrustRepository = {
  reserve(
    owner: string,
    peer: string,
    revision: number,
    nonce: string,
    expiresAt: number,
  ): void {
    const db = getDeviceTrustDatabase(owner);
    const now = Date.now();

    if (
      !/^[a-f0-9]{64}$/.test(nonce) ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= now ||
      expiresAt > now + 360_000
    ) {
      invalid();
    }

    db.withTransactionSync(() => {
      db.runSync(
        'DELETE FROM pairing_attempts WHERE expires_at <= ?',
        now,
      );
      db.runSync(
        'DELETE FROM pairing_peer_nonces WHERE expires_at <= ?',
        now,
      );

      const recent = db.getFirstSync<{ count: number }>(
        `SELECT count(*) AS count FROM pairing_attempts
         WHERE created_at > ?`,
        now - 60_000,
      );

      if ((recent?.count ?? 0) >= 5) invalid();

      const request = db.getFirstSync<{
        state: string;
        revision: number;
      }>(
        `SELECT state, revision FROM device_requests
         WHERE fingerprint = ?`,
        peer,
      );

      if (
        request?.state !== 'pending' ||
        request.revision !== revision
      ) {
        invalid();
      }

      db.runSync(
        `INSERT INTO pairing_attempts
         (nonce, peer_fingerprint, request_revision,
          expires_at, created_at, used)
         VALUES (?, ?, ?, ?, ?, 0)`,
        nonce,
        peer,
        revision,
        expiresAt,
        now,
      );
    });
  },

  cancel(owner: string, nonce: string): void {
    getDeviceTrustDatabase(owner).runSync(
      'UPDATE pairing_attempts SET used = 1 WHERE nonce = ?',
      nonce,
    );
  },

  complete(
    owner: string,
    peer: string,
    nonce: string,
    peerNonce: string,
    expiresAt: number,
  ): void {
    const db = getDeviceTrustDatabase(owner);
    const now = Date.now();

    db.withTransactionSync(() => {
      const attempt = db.getFirstSync<{
        peer_fingerprint: string;
        request_revision: number;
        expires_at: number;
        used: number;
      }>(
        'SELECT * FROM pairing_attempts WHERE nonce = ?',
        nonce,
      );

      const request = db.getFirstSync<{
        revision: number;
        state: string;
      }>(
        `SELECT revision, state FROM device_requests
         WHERE fingerprint = ?`,
        peer,
      );

      if (
        !attempt ||
        attempt.used !== 0 ||
        attempt.peer_fingerprint !== peer ||
        attempt.expires_at <= now ||
        expiresAt <= now ||
        expiresAt > attempt.expires_at ||
        request?.state !== 'pending' ||
        request.revision !== attempt.request_revision ||
        !/^[a-f0-9]{64}$/.test(peerNonce) ||
        peerNonce === nonce
      ) {
        invalid();
      }

      db.runSync(
        `INSERT INTO pairing_peer_nonces
         (peer_fingerprint, nonce, expires_at)
         VALUES (?, ?, ?)`,
        peer,
        peerNonce,
        expiresAt,
      );

      const changed = db.runSync(
        `UPDATE device_requests
         SET state = 'trusted', paired_at = ?,
             revision = revision + 1
         WHERE fingerprint = ? AND state = 'pending'
           AND revision = ?`,
        now,
        peer,
        request.revision,
      );

      if (changed.changes !== 1) invalid();

      db.runSync(
        'UPDATE pairing_attempts SET used = 1 WHERE nonce = ?',
        nonce,
      );

      db.runSync(
        `INSERT INTO trust_events
         (peer_fingerprint, action, revision, created_at)
         VALUES (?, 'paired', ?, ?)`,
        peer,
        request.revision + 1,
        now,
      );
    });
  },
};
