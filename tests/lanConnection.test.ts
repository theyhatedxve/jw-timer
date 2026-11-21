import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isPrivateIpv4, parseLanConnection } from '../src/backend/domain/devices/lanConnection';

const code = {
  version: 1, host: '192.168.1.10', port: 49373,
  congregationId: 'a'.repeat(32), fingerprint: `sha256:${'b'.repeat(64)}`,
};

test('LAN connection accepts private IPv4 addresses', () => {
  for (const address of ['10.0.0.2', '172.16.0.2', '172.31.255.2', '192.168.1.2']) {
    assert.equal(isPrivateIpv4(address), true);
  }
});

test('LAN connection rejects public, loopback, malformed, and named hosts', () => {
  for (const address of ['8.8.8.8', '127.0.0.1', '0.0.0.0', '172.32.0.2',
    '192.168.001.2', '192.168.1.999', 'example.com']) {
    assert.equal(isPrivateIpv4(address), false);
  }
});

test('connection codes require exact version, port, scope, fingerprint, and fields', () => {
  assert.equal(parseLanConnection(JSON.stringify(code)).port, 49373);
  for (const change of [
    { version: 2 }, { port: 80 }, { congregationId: 'invalid' },
    { fingerprint: 'invalid' }, { extra: true },
  ]) {
    assert.throws(() => parseLanConnection(JSON.stringify({ ...code, ...change })));
  }
});
