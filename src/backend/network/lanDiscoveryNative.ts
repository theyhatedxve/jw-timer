import { requireOptionalNativeModule } from 'expo';
import { parseLanConnection } from '../domain/devices/lanConnection';

interface NativeDiscovery {
  startLanDiscovery(): Promise<number>;
  stopLanDiscovery(): Promise<void>;
  addListener(name: string, callback: (input: unknown) => void): { remove(): void };
}
function native(): NativeDiscovery {
  const module = requireOptionalNativeModule<NativeDiscovery>('DeviceIdentity');
  if (!module) throw new Error('Rebuild required for LAN discovery');
  return module;
}
let operations: Promise<unknown> = Promise.resolve();
function serialize<T>(action: () => Promise<T>): Promise<T> {
  const next = operations.catch(() => undefined).then(action);
  operations = next.catch(() => undefined);
  return next;
}
export const lanDiscoveryNative = {
  start: () => serialize(async () => {
    const generation = await native().startLanDiscovery();
    if (!Number.isSafeInteger(generation) || generation <= 0) throw new Error('Invalid discovery generation');
    return generation;
  }),
  stop: () => serialize(() => native().stopLanDiscovery()),
  onState(callback: (state: { generation: number; state: 'stopped' | 'failed'; reason: string }) => void) {
    return native().addListener('onLanDiscoveryState', input => {
      if (typeof input !== 'object' || input === null) return;
      const event = input as Record<string, unknown>;
      if (typeof event.generation !== 'number' || !Number.isSafeInteger(event.generation) || event.generation <= 0 ||
        (event.state !== 'stopped' && event.state !== 'failed') || typeof event.reason !== 'string') return;
      callback({ generation: event.generation, state: event.state, reason: event.reason });
    });
  },
  onFound(callback: (code: string) => void) {
    return native().addListener('onLanDiscovered', input => {
      try {
        if (typeof input !== 'object' || input === null || !('code' in input) || typeof input.code !== 'string') return;
        const code = parseLanConnection(input.code);
        callback(JSON.stringify(code));
      } catch { /* Discovery metadata is untrusted. Ignore malformed advertisements. */ }
    });
  },
};
