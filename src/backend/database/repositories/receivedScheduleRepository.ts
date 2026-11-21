import {
  openDatabaseSync,
  type SQLiteDatabase,
} from 'expo-sqlite';

import { isDeviceFingerprint } from '../../domain/devices/devicePermissions';
import { isCongregationId } from '../../domain/profile/profile';
import { parseSharedSchedule } from '../../domain/devices/sharedSchedule';

let connection: SQLiteDatabase | null = null;

function database(): SQLiteDatabase {
  if (connection) return connection;

  const db = openDatabaseSync('jw-timer-received-schedules.db');

  try {
    db.execSync(`
      PRAGMA foreign_keys = ON;
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 3000;
    `);

    const version = db.getFirstSync<{ user_version: number }>(
      'PRAGMA user_version',
    )?.user_version;

    if (version === 0) {
      db.withTransactionSync(() => {
        db.execSync(`
          CREATE TABLE received_schedules (
            owner_fingerprint TEXT NOT NULL,
            local_congregation_id TEXT NOT NULL,
            peer_fingerprint TEXT NOT NULL,
            payload_json TEXT NOT NULL,
            received_at INTEGER NOT NULL,
            PRIMARY KEY (
              owner_fingerprint,
              local_congregation_id,
              peer_fingerprint
            )
          );
          PRAGMA user_version = 1;
        `);
      });
    } else if (version !== 1) {
      throw new Error('Unsupported received schedule database');
    }

    connection = db;
    return db;
  } catch (error) {
    db.closeSync();
    throw error;
  }
}

function validateAddress(
  owner: string,
  localScope: string,
  peer: string,
): void {
  if (
    !isDeviceFingerprint(owner) ||
    !isDeviceFingerprint(peer) ||
    owner === peer ||
    !isCongregationId(localScope)
  ) {
    throw new Error('Invalid received schedule address');
  }
}

export const receivedScheduleRepository = {
  read(owner: string, localScope: string, peer: string): string | null {
    validateAddress(owner, localScope, peer);

    const row = database().getFirstSync<{ payload_json: string }>(
      `SELECT payload_json FROM received_schedules
       WHERE owner_fingerprint = ?
         AND local_congregation_id = ?
         AND peer_fingerprint = ?`,
      owner, localScope, peer,
    );

    if (!row) return null;

    return JSON.stringify(
      parseSharedSchedule(JSON.parse(row.payload_json)),
    );
  },

  save(
    owner: string,
    localScope: string,
    peer: string,
    serialized: string,
  ): void {
    validateAddress(owner, localScope, peer);

    const payload = JSON.stringify(
      parseSharedSchedule(JSON.parse(serialized)),
    );

    database().withTransactionSync(() => {
      database().runSync(
        `INSERT INTO received_schedules
         (owner_fingerprint, local_congregation_id,
          peer_fingerprint, payload_json, received_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(
           owner_fingerprint, local_congregation_id, peer_fingerprint
         ) DO UPDATE SET
           payload_json = excluded.payload_json,
           received_at = excluded.received_at`,
        owner, localScope, peer, payload, Date.now(),
      );
    });
  },
};