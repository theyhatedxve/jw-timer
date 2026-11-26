import { getAppDatabase } from '../appDatabase';
import {
  isFullscreenTimerPreferences,
  type FullscreenTimerPreferences,
} from '../../domain/timer/fullscreenTimer';

const KEY = 'fullscreen-timer';

export const fullscreenTimerRepository = {
  read(): unknown {
    const row = getAppDatabase().getFirstSync<{ value_json: string }>(
      'SELECT value_json FROM app_preferences WHERE key = ?', KEY,
    );
    if (!row) return null;
    if (typeof row.value_json !== 'string' || row.value_json.length > 512) {
      throw new Error('Invalid fullscreen timer preferences');
    }
    return JSON.parse(row.value_json) as unknown;
  },

  write(value: FullscreenTimerPreferences): void {
    if (!isFullscreenTimerPreferences(value)) throw new Error('Invalid fullscreen timer preferences');
    getAppDatabase().runSync(
      `INSERT INTO app_preferences (key, value_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
      KEY, JSON.stringify(value), Date.now(),
    );
  },
};
