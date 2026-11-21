import { getAppDatabase } from '../appDatabase';

import type {
  AppearanceRepository,
} from '../../services/appearanceService';

const KEY = 'appearance';

export const appearanceRepository: AppearanceRepository = {
  read(): unknown {
    const row = getAppDatabase().getFirstSync<{ value_json: string }>(
      'SELECT value_json FROM app_preferences WHERE key = ?',
      KEY,
    );

    if (!row) return null;

    if (
      typeof row.value_json !== 'string' ||
      row.value_json.length > 64
    ) {
      throw new Error('Invalid appearance preference');
    }

    return JSON.parse(row.value_json) as unknown;
  },

  write(preference): void {
    getAppDatabase().runSync(
      `INSERT INTO app_preferences (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value_json = excluded.value_json,
         updated_at = excluded.updated_at`,
      KEY,
      JSON.stringify(preference),
      Date.now(),
    );
  },
};
