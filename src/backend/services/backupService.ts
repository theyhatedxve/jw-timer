import {
  BackupFailure,
  decodeBackup,
  type BackupArchive,
  type BackupSummary,
} from '../domain/backups/backupFormat';

interface Repository {
  capture(): BackupArchive;
  token(): string;
  prepare(archive: BackupArchive): BackupSummary;
  restore(archive: BackupArchive, token: string): void;
}

interface Files {
  read(): Promise<Uint8Array | null>;
  write(bytes: Uint8Array): Promise<boolean>;
}

interface Crypto {
  encrypt(text: string, password: string): Promise<Uint8Array>;
  decrypt(bytes: Uint8Array, password: string): Promise<string>;
}

function checkPassword(password: string): void {
  if (password.length < 12 || password.length > 128) {
    throw new BackupFailure('password');
  }
}

export function createBackupService(
  repository: Repository,
  files: Files,
  crypto: Crypto,
) {
  let generation = 0;
  let pending: {
    archive: BackupArchive;
    token: string;
  } | null = null;

  return {
    clear() {
      generation += 1;
      pending = null;
    },

    async export(password: string): Promise<boolean> {
      checkPassword(password);

      generation += 1;
      pending = null;

      const archive = repository.capture();
      const encrypted = await crypto.encrypt(
        JSON.stringify(archive),
        password,
      );

      return files.write(encrypted);
    },

    async preview(password: string): Promise<BackupSummary | null> {
      checkPassword(password);

      const request = ++generation;
      pending = null;

      const bytes = await files.read();
      if (!bytes || request !== generation) return null;

      const plaintext = await crypto.decrypt(bytes, password);
      if (request !== generation) return null;

      const archive = decodeBackup(plaintext);
      const summary = repository.prepare(archive);

      pending = { archive, token: repository.token() };
      return summary;
    },

    restore(): void {
      if (!pending) throw new BackupFailure('invalid');

      repository.restore(pending.archive, pending.token);

      pending = null;
      generation += 1;
    },
  };
}

export type BackupService = ReturnType<typeof createBackupService>;