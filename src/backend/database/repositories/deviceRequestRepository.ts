import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import {
  PairingFailure,
  parseDeviceInvitation,
  type DeviceInvitation,
  type DeviceRequest,
} from '../../domain/devices/deviceInvitation';

let connection: SQLiteDatabase | null = null;

function database(localFingerprint: string): SQLiteDatabase {
  if (!connection) {
    const db = openDatabaseSync('jw-timer-device-trust.db', {
      useNewConnection: true,
    });

    try {
        db.execSync(
        'PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 3000;',
      );
      const version = db.getFirstSync<{ user_version: number }>(
        'PRAGMA user_version',
      )?.user_version;

    if (
        version !== 0 &&
        version !== 1 &&
        version !== 2 &&
        version !== 3
      ) {
        throw new PairingFailure('storage');
      }

      if (version === 0) {
        db.withTransactionSync(() => {
          db.execSync(`
            CREATE TABLE registry_identity (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              fingerprint TEXT NOT NULL
            );

            CREATE TABLE device_requests (
              fingerprint TEXT PRIMARY KEY NOT NULL,
              public_key TEXT NOT NULL,
              label TEXT NOT NULL
                CHECK (length(trim(label)) BETWEEN 1 AND 100),
              state TEXT NOT NULL
                CHECK (state IN ('pending', 'revoked')),
              created_at INTEGER NOT NULL CHECK (created_at >= 0)
            );

            PRAGMA user_version = 1;
          `);
        });
      }

            const currentVersion = db.getFirstSync<{
        user_version: number;
      }>('PRAGMA user_version')?.user_version;

      if (currentVersion === 1) {
        db.withTransactionSync(() => {
          db.execSync(`
            CREATE TABLE device_requests_v2 (
              fingerprint TEXT PRIMARY KEY NOT NULL,
              public_key TEXT NOT NULL,
              label TEXT NOT NULL
                CHECK (length(trim(label)) BETWEEN 1 AND 100),
              state TEXT NOT NULL
                CHECK (state IN ('pending', 'trusted', 'revoked')),
              created_at INTEGER NOT NULL CHECK (created_at >= 0),
              revision INTEGER NOT NULL DEFAULT 1
                CHECK (revision >= 1),
              paired_at INTEGER
            );

            INSERT INTO device_requests_v2
              (fingerprint, public_key, label, state, created_at)
            SELECT fingerprint, public_key, label, state, created_at
            FROM device_requests;

            DROP TABLE device_requests;

            ALTER TABLE device_requests_v2
              RENAME TO device_requests;

            CREATE TABLE pairing_attempts (
              nonce TEXT PRIMARY KEY NOT NULL,
              peer_fingerprint TEXT NOT NULL
                REFERENCES device_requests(fingerprint),
              request_revision INTEGER NOT NULL,
              expires_at INTEGER NOT NULL,
              created_at INTEGER NOT NULL,
              used INTEGER NOT NULL CHECK (used IN (0, 1))
            );

            CREATE TABLE pairing_peer_nonces (
              peer_fingerprint TEXT NOT NULL
                REFERENCES device_requests(fingerprint),
              nonce TEXT NOT NULL,
              expires_at INTEGER NOT NULL,
              PRIMARY KEY (peer_fingerprint, nonce)
            );

            CREATE TABLE trust_events (
              id INTEGER PRIMARY KEY,
              peer_fingerprint TEXT NOT NULL,
              action TEXT NOT NULL
                CHECK (action IN ('paired', 'revoked', 'reopened')),
              revision INTEGER NOT NULL,
              created_at INTEGER NOT NULL
            );

            PRAGMA user_version = 2;
          `);
        });
      }

            const permissionVersion = db.getFirstSync<{
        user_version: number;
      }>('PRAGMA user_version')?.user_version;

      if (permissionVersion === 2) {
        db.withTransactionSync(() => {
          db.execSync(`
            CREATE TABLE device_grants (
              congregation_id TEXT NOT NULL,
              peer_fingerprint TEXT NOT NULL
                REFERENCES device_requests(fingerprint),
              permission TEXT NOT NULL
                CHECK (permission = 'schedule.read'),
              issuer_fingerprint TEXT NOT NULL,
              peer_revision INTEGER NOT NULL CHECK (peer_revision >= 1),
              enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
              revision INTEGER NOT NULL CHECK (revision >= 1),
              expires_at INTEGER,
              updated_at INTEGER NOT NULL,
              PRIMARY KEY (
                congregation_id, peer_fingerprint, permission
              )
            );

            CREATE INDEX idx_device_grants_peer
              ON device_grants(peer_fingerprint);

            CREATE TABLE grant_events (
              id INTEGER PRIMARY KEY,
              congregation_id TEXT NOT NULL,
              peer_fingerprint TEXT NOT NULL,
              permission TEXT NOT NULL
                CHECK (permission = 'schedule.read'),
              action TEXT NOT NULL
                CHECK (action IN (
                  'enabled', 'disabled', 'peer-revoked'
                )),
              grant_revision INTEGER NOT NULL,
              created_at INTEGER NOT NULL
            );

            PRAGMA user_version = 3;
          `);
        });
      }

      connection = db;
    } catch (error) {
      db.closeSync();
      throw error;
    }
  }

  const db = connection;

  db.withTransactionSync(() => {
    const owner = db.getFirstSync<{ fingerprint: string }>(
      'SELECT fingerprint FROM registry_identity WHERE id = 1',
    );

    if (!owner) {
      db.runSync(
        'INSERT INTO registry_identity (id, fingerprint) VALUES (1, ?)',
        localFingerprint,
      );
    } else if (owner.fingerprint !== localFingerprint) {
      throw new PairingFailure('identity');
    }
  });

  return db;
}

export const deviceRequestRepository = {
  list(localFingerprint: string): readonly DeviceRequest[] {
    const rows = database(localFingerprint).getAllSync<{
      fingerprint: string;
      public_key: string;
      label: string;
      state: string;
      created_at: number;
      revision: number;
    }>(
      `SELECT fingerprint, public_key, label, state,
        created_at, revision
       FROM device_requests ORDER BY created_at, fingerprint`,
    );

    return rows.map(row => {
      parseDeviceInvitation(JSON.stringify({
        kind: 'jw-timer-device-invitation',
        version: 1,
        publicKey: row.public_key,
        fingerprint: row.fingerprint,
      }));

      if (
        typeof row.label !== 'string' ||
        row.label.trim().length === 0 ||
        row.label.length > 100 ||
        /[\u0000-\u001f\u007f]/.test(row.label) ||
        (
          row.state !== 'pending' &&
          row.state !== 'trusted' &&
          row.state !== 'revoked'
        ) ||
        !Number.isSafeInteger(row.revision) ||
        row.revision < 1 ||
        !Number.isSafeInteger(row.created_at) ||
        row.created_at < 0
      ) {
        throw new PairingFailure('storage');
      }

      return {
        fingerprint: row.fingerprint,
        publicKey: row.public_key,
        label: row.label,
        state: row.state,
        createdAt: row.created_at,
        revision: row.revision,
      };
    });
  },

  add(
    localFingerprint: string,
    label: string,
    invitation: DeviceInvitation,
  ): void {
    const db = database(localFingerprint);

    db.withTransactionSync(() => {
      const existing = db.getFirstSync(
        'SELECT fingerprint FROM device_requests WHERE fingerprint = ?',
        invitation.fingerprint,
      );

      if (existing) throw new PairingFailure('duplicate');

      db.runSync(
        `INSERT INTO device_requests
         (fingerprint, public_key, label, state, created_at)
         VALUES (?, ?, ?, 'pending', ?)`,
        invitation.fingerprint,
        invitation.publicKey,
        label,
        Date.now(),
      );
    });
  },

  revoke(localFingerprint: string, fingerprint: string): void {
    
    const db = database(localFingerprint);

    db.withTransactionSync(() => {
              const revokedAt = Date.now();

      db.runSync(
        `INSERT INTO grant_events
         (congregation_id, peer_fingerprint, permission,
          action, grant_revision, created_at)
         SELECT congregation_id, peer_fingerprint, permission,
                'peer-revoked', revision + 1, ?
         FROM device_grants
         WHERE peer_fingerprint = ? AND enabled = 1`,
        revokedAt,
        fingerprint,
      );

      db.runSync(
        `UPDATE device_grants
         SET enabled = 0, revision = revision + 1,
             updated_at = ?
         WHERE peer_fingerprint = ? AND enabled = 1`,
        revokedAt,
        fingerprint,
      );
      
      const changed = db.runSync(
        `UPDATE device_requests
         SET state = 'revoked', revision = revision + 1
         WHERE fingerprint = ? AND state <> 'revoked'`,
        fingerprint,
      );

      db.runSync(
        'UPDATE pairing_attempts SET used = 1 WHERE peer_fingerprint = ?',
        fingerprint,
      );

      if (changed.changes === 1) {
        db.runSync(
          `INSERT INTO trust_events
             (peer_fingerprint, action, revision, created_at)
           SELECT fingerprint, 'revoked', revision, ?
           FROM device_requests WHERE fingerprint = ?`,
          Date.now(),
          fingerprint,
        );
      }
    });
  },

  reopen(localFingerprint: string, fingerprint: string): void {
    const db = database(localFingerprint);

    db.withTransactionSync(() => {
      const changed = db.runSync(
        `UPDATE device_requests
         SET state = 'pending', revision = revision + 1,
             paired_at = NULL
         WHERE fingerprint = ? AND state = 'revoked'`,
        fingerprint,
      );

      if (changed.changes !== 1) {
        throw new PairingFailure('invalid');
      }

      db.runSync(
        'UPDATE pairing_attempts SET used = 1 WHERE peer_fingerprint = ?',
        fingerprint,
      );

      db.runSync(
        `INSERT INTO trust_events
           (peer_fingerprint, action, revision, created_at)
         SELECT fingerprint, 'reopened', revision, ?
         FROM device_requests WHERE fingerprint = ?`,
        Date.now(),
        fingerprint,
      );
    });
  },
};

export { database as getDeviceTrustDatabase };
