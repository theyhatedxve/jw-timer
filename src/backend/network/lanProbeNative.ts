import { requireOptionalNativeModule } from 'expo';

interface Subscription { remove(): void }
interface NativeLan {
  newLanToken(): Promise<unknown>;
  describeLanEndpoint(scope: string): Promise<unknown>;
  startLanProbe(id: string, peer: string, scope: string): Promise<unknown>;
  probeLanPeer(peer: string, code: string): Promise<unknown>;
  resolveLanAuthorization(ticket: string, allowed: boolean): Promise<void>;
  stopLanProbe(): Promise<void>;
  checkLanProtocol(): Promise<unknown>;
  addListener(name: string, callback: (event: unknown) => void): Subscription;
}

function native(): NativeLan {
  const module = requireOptionalNativeModule<NativeLan>('DeviceIdentity');
  if (!module) throw new Error('Rebuild required for LAN checks');
  return module;
}

export const lanProbeNative = {
  async token(): Promise<string> {
    const result = await native().newLanToken();
    if (typeof result !== 'string' || !/^[a-f0-9]{64}$/.test(result)) {
      throw new Error('Invalid LAN token');
    }
    return result;
  },
  describe: (scope: string) => native().describeLanEndpoint(scope),
  start: (id: string, peer: string, scope: string) => native().startLanProbe(id, peer, scope),
  probe: (peer: string, code: string) => native().probeLanPeer(peer, code),
  resolve: (ticket: string, allowed: boolean) => native().resolveLanAuthorization(ticket, allowed),
  stop: () => native().stopLanProbe(),
  checkProtocol: async () => await native().checkLanProtocol() === true,
  onAuthorize: (callback: (event: unknown) => void) => native().addListener('onLanAuthorize', callback),
  onStopped: (callback: (event: unknown) => void) => native().addListener('onLanStopped', callback),
};
