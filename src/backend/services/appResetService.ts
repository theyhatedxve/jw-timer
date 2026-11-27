export interface AppResetStorage {
  isPending(): boolean;
  begin(): void;
  clear(): void;
  finish(): void;
}

export function createAppResetService(storage: AppResetStorage) {
  return {
    isPending: () => storage.isPending(),
    reset(): boolean {
      try {
        // Keep this marker until every store is cleared, including on retry.
        storage.begin();
        storage.clear();
        storage.finish();
        return true;
      } catch {
        return false;
      }
    },
  };
}

export type AppResetService = ReturnType<typeof createAppResetService>;
