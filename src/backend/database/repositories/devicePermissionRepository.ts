import type { SQLiteDatabase } from 'expo-sqlite';
import { getDeviceTrustDatabase } from './deviceRequestRepository';

import { isCongregationId } from '../../domain/profile/profile';

import {
  isDeviceFingerprint,
  PermissionFailure,
  type ReadGrant,
  type ReadGrantCommand,
} from '../../domain/devices/devicePermissions';

interface GrantRow {
  congregation_id: string;
  peer_fingerprint: string;
  issuer_fingerprint: string;
  permission: string;
  peer_revision: number;
  enabled: number;
  revision: number;
  expires_at: number | null;
}

function readGrant(
  db: SQLiteDatabase,
  peer: string,
  congregationId: string,
): ReadGrant | null {
  const row = db.getFirstSync<GrantRow>(
    `SELECT * FROM device_grants
     WHERE congregation_id = ? AND peer_fingerprint = ?
       AND permission = 'schedule.read'`,
    congregationId,
    peer,
  );

  if (!row) return null;

  if (
    !isCongregationId(row.congregation_id) ||
    !isDeviceFingerprint(row.peer_fingerprint) ||
    !isDeviceFingerprint(row.issuer_fingerprint) ||
    row.permission !== 'schedule.read' ||
    !Number.isSafeInteger(row.peer_revision) ||
    row.peer_revision < 1 ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 1 ||
    (row.enabled !== 0 && row.enabled !== 1) ||
    (
      row.expires_at !== null &&
      (
        !Number.isSafeInteger(row.expires_at) ||
        row.expires_at < 0
      )
    )
  ) {
    throw new PermissionFailure('storage');
  }

  return {
    congregationId: row.congregation_id,
    peerFingerprint: row.peer_fingerprint,
    issuerFingerprint: row.issuer_fingerprint,
    permission: 'schedule.read',
    peerRevision: row.peer_revision,
    enabled: row.enabled === 1,
    revision: row.revision,
    expiresAt: row.expires_at,
  };
}

export const devicePermissionRepository = {
  read(
    owner: string,
    peer: string,
    congregationId: string,
  ): ReadGrant | null {
    return readGrant(
      getDeviceTrustDatabase(owner),
      peer,
      congregationId,
    );
  },

  set(owner: string, command: ReadGrantCommand): void {
    if (owner === command.peerFingerprint) {
      throw new PermissionFailure('denied');
    }

    const db = getDeviceTrustDatabase(owner);

    db.withTransactionSync(() => {
      const peer = db.getFirstSync<{
        state: string;
        revision: number;
      }>(
        `SELECT state, revision FROM device_requests
         WHERE fingerprint = ?`,
        command.peerFingerprint,
      );

      if (
        !peer ||
        peer.revision !== command.peerRevision ||
        (command.enabled && peer.state !== 'trusted')
      ) {
        throw new PermissionFailure('conflict');
      }

      const current = readGrant(
        db,
        command.peerFingerprint,
        command.congregationId,
      );

      if ((current?.revision ?? 0) !== command.grantRevision) {
        throw new PermissionFailure('conflict');
      }

      const revision = command.grantRevision + 1;
      const now = Date.now();

      if (!Number.isSafeInteger(revision)) {
        throw new PermissionFailure('storage');
      }

      const changed = db.runSync(
        `INSERT INTO device_grants
         (congregation_id, peer_fingerprint, permission,
          issuer_fingerprint, peer_revision, enabled,
          revision, expires_at, updated_at)
         VALUES (?, ?, 'schedule.read', ?, ?, ?, ?, NULL, ?)
         ON CONFLICT(
           congregation_id, peer_fingerprint, permission
         ) DO UPDATE SET
           issuer_fingerprint = excluded.issuer_fingerprint,
           peer_revision = excluded.peer_revision,
           enabled = excluded.enabled,
           revision = excluded.revision,
           expires_at = NULL,
           updated_at = excluded.updated_at
         WHERE device_grants.revision = ?`,
        command.congregationId,
        command.peerFingerprint,
        owner,
        peer.revision,
        command.enabled ? 1 : 0,
        revision,
        now,
        command.grantRevision,
      );

      if (changed.changes !== 1) {
        throw new PermissionFailure('conflict');
      }

      db.runSync(
        `INSERT INTO grant_events
         (congregation_id, peer_fingerprint, permission,
          action, grant_revision, created_at)
         VALUES (?, ?, 'schedule.read', ?, ?, ?)`,
        command.congregationId,
        command.peerFingerprint,
        command.enabled ? 'enabled' : 'disabled',
        revision,
        now,
      );
    });
  },
};