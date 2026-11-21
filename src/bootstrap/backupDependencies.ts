import { createBackupService } from '../backend/services/backupService';
import { backupRepository } from '../backend/database/repositories/backupRepository';
import { backupFiles } from '../backend/files/backupFiles';
import { backupCrypto } from '../backend/files/backupCrypto';

export const backupService = createBackupService(
  backupRepository,
  backupFiles,
  backupCrypto,
);