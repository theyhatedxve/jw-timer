import * as DocumentPicker from 'expo-document-picker';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { File, Paths } from 'expo-file-system';

import {
  BackupFailure,
  MAX_BACKUP_BYTES,
} from '../domain/backups/backupFormat';

export const backupFiles = {
  async read(): Promise<Uint8Array | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      multiple: false,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return null;

    const asset = result.assets[0];
    const cacheRoot = `${Paths.cache.uri.replace(/\/+$/, '')}/`;

    if (!asset || !asset.uri.startsWith(cacheRoot)) {
      throw new BackupFailure('invalid');
    }

    const file = new File(asset.uri);

    try {
      if (
        !file.exists ||
        file.size < 53 ||
        file.size > MAX_BACKUP_BYTES + 52
      ) {
        throw new BackupFailure('invalid');
      }

      return await file.bytes();
    } finally {
      try {
        if (file.exists) file.delete();
      } catch {
        // Cache cleanup must not hide the original result.
      }
    }
  },

  async write(bytes: Uint8Array): Promise<boolean> {
    const access =
      await LegacyFileSystem.StorageAccessFramework
        .requestDirectoryPermissionsAsync();

    if (!access.granted) return false;

    const name = `JW-Timer-${Date.now()}.jwtbackup`;
    const cached = new File(Paths.cache, name);
    let destination: string | null = null;
    let complete = false;
    let createdCache = false;

    try {
      cached.create({ overwrite: false });
      createdCache = true;
      await cached.write(bytes);

      destination =
        await LegacyFileSystem.StorageAccessFramework.createFileAsync(
          access.directoryUri,
          name,
          'application/octet-stream',
        );

      await LegacyFileSystem.writeAsStringAsync(
        destination,
        await cached.base64(),
        { encoding: LegacyFileSystem.EncodingType.Base64 },
      );

      complete = true;
      return true;
    } finally {
      if (createdCache) {
        try {
          if (cached.exists) cached.delete();
        } catch {
          // The temporary copy contains encrypted bytes only.
        }
      }

      if (destination !== null && !complete) {
        try {
          await LegacyFileSystem.deleteAsync(destination, {
            idempotent: true,
          });
        } catch {
          // Preserve the export failure.
        }
      }
    }
  },
};