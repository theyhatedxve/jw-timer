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
      db.execSync('PRAGMA busy_timeout = 3000');

      const version = db.getFirstSync<{ user_version: number }>(
        'PRAGMA user_version',
      )?.user_version;

      if (version !== 0 && version !== 1) {
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
    }>(
      `SELECT fingerprint, public_key, label, state, created_at
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
        (row.state !== 'pending' && row.state !== 'revoked') ||
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
    database(localFingerprint).runSync(
      `UPDATE device_requests SET state = 'revoked'
       WHERE fingerprint = ?`,
      fingerprint,
    );
  },
};