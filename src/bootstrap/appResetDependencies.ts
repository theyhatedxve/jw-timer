import { Directory, File, Paths } from 'expo-file-system';

import { deleteAppDatabase } from '../backend/database/appDatabase';
import { deleteTimerDatabase } from '../backend/database/repositories/timerStorage';
import { createAppResetService } from '../backend/services/appResetService';
import { backupService } from './backupDependencies';

const marker = () => new File(Paths.document, 'jw-timer-reset-pending');

export const appResetService = createAppResetService({
  isPending: () => marker().exists,
  begin() {
    const pending = marker();
    if (!pending.exists) pending.create({ overwrite: false });
  },
  clear() {
    backupService.clear();
    deleteAppDatabase();
    deleteTimerDatabase();

    const imports = new Directory(Paths.cache, 'DocumentPicker');
    if (imports.exists) imports.delete();
    for (const entry of Paths.cache.list()) {
      if (entry instanceof File && /^JW-Timer-\d+\.jwtbackup$/.test(entry.name)) {
        entry.delete();
      }
    }
  },
  finish: () => marker().delete(),
});
