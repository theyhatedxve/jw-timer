import { requireOptionalNativeModule } from 'expo';

import {
  BackupFailure,
  MAX_BACKUP_BYTES,
} from '../domain/backups/backupFormat';

interface NativeBackupCrypto {
  encrypt(text: string, password: string): Promise<unknown>;
  decrypt(bytes: Uint8Array, password: string): Promise<unknown>;
}

function native(): NativeBackupCrypto {
  const module =
    requireOptionalNativeModule<NativeBackupCrypto>('BackupCrypto');

  if (!module) throw new BackupFailure('native');
  return module;
}

export const backupCrypto = {
  async encrypt(text: string, password: string): Promise<Uint8Array> {
    const result = await native().encrypt(text, password);

    if (
      !(result instanceof Uint8Array) ||
      result.length > MAX_BACKUP_BYTES + 52
    ) {
      throw new BackupFailure('invalid');
    }

    return result;
  },

  async decrypt(bytes: Uint8Array, password: string): Promise<string> {
    const result = await native().decrypt(bytes, password);

    if (
      typeof result !== 'string' ||
      result.length > MAX_BACKUP_BYTES
    ) {
      throw new BackupFailure('invalid');
    }

    return result;
  },
};