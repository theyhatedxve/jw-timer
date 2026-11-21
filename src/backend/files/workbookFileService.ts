import * as DocumentPicker from 'expo-document-picker';
import { File, FileMode, Paths } from 'expo-file-system';

import {
  MAX_WORKBOOK_BYTES,
  type WorkbookFileService,
} from '../domain/imports/workbookFile';

import { workbookImportEn as text } from '../../constants/strings/workbookImportEn';

function releaseCachedFile(uri: string): void {
  const cacheRoot = `${Paths.cache.uri.replace(/\/+$/, '')}/`;

  if (!uri.startsWith(cacheRoot)) return;

  try {
    const file = new File(uri);

    if (file.exists) file.delete();
  } catch {
    // Cache cleanup must not prevent leaving the screen.
  }
}

export const workbookFileService: WorkbookFileService = {
  async select() {
    let cachedUri: string | null = null;
    let retained = false;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { ok: true, file: null };
      }

      const asset = result.assets[0];

      if (!asset) {
        return { ok: false, message: text.unreadable };
      }

      cachedUri = asset.uri;

      const cacheRoot = `${Paths.cache.uri.replace(/\/+$/, '')}/`;

      if (!cachedUri.startsWith(cacheRoot)) {
        return { ok: false, message: text.unreadable };
      }

      const file = new File(cachedUri);
      const size = file.size;

      if (
        !file.exists ||
        !Number.isSafeInteger(size) ||
        size < 5 ||
        size > MAX_WORKBOOK_BYTES
      ) {
        return { ok: false, message: text.tooLarge };
      }

      const handle = file.open(FileMode.ReadOnly);
      let validHeader = false;

      try {
        const header = await handle.readBytes(5);
        const expected = [37, 80, 68, 70, 45];

        validHeader =
          header.length === expected.length &&
          expected.every((byte, index) => header[index] === byte);
      } finally {
        handle.close();
      }

      if (!validHeader) {
        return { ok: false, message: text.invalid };
      }

      retained = true;

      return {
        ok: true,
        file: {
          uri: cachedUri,
          name: asset.name,
          size,
        },
      };
    } catch {
      return { ok: false, message: text.unreadable };
    } finally {
      if (cachedUri !== null && !retained) {
        releaseCachedFile(cachedUri);
      }
    }
  },

  release(file) {
    releaseCachedFile(file.uri);
  },
};