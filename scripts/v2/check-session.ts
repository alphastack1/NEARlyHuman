import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import { cacheV2Session, restoreV2Session, setV2Session, V2ApiError } from '../../src/app/v2-api';
import { handleV2Api } from '../../server/v2/http';

// Check reload reuse against the actual server MAC/chain/expiry validator. The
// fake public runtime is used only for /session; there are no RPC/model sends.
const previous = { secret: process.env.NEARLYHUMAN_SESSION_SECRET, runtime: process.env.NEARLYHUMAN_V2_RUNTIME_JSON };
const originalFetch = globalThis.fetch, originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
const entries = new Map<string, string>(), storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); }, removeItem: (key: string) => { entries.delete(key); } };
Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
const address = '0x1111111111111111111111111111111111111111', collection = '0x2222222222222222222222222222222222222222', hash = '0x' + '3'.repeat(64);
const world = { chainId: 46630, collection: collection as `0x${string}` };
const secret = randomBytes(32).toString('hex'), expiresAt = Math.floor(Date.now() / 1000) + 3600;
process.env.NEARLYHUMAN_SESSION_SECRET = secret;
process.env.NEARLYHUMAN_V2_RUNTIME_JSON = JSON.stringify({ ...world, verifier: address, actionModule: address, controllerCodeHash: hash, verifierCodeHash: hash, actionModuleCodeHash: hash, rulesHash: hash, decisionConfig: hash, relayer: address, quoteSigner: address });
const makeToken = (chainId = 46630, expiry = expiresAt) => { const payload = Buffer.from(JSON.stringify({ address, chainId, expiresAt: expiry })).toString('base64url'); return payload + '.' + createHmac('sha256', secret).update(payload).digest('base64url'); };
let reads = 0, passed = 0;
globalThis.fetch = async (_input, init) => { reads++; return handleV2Api(new Request('http://127.0.0.1/api/v2/session', init)); };
try {
  cacheV2Session(address, world, { token: makeToken(), expiresAt });
  assert.equal(await restoreV2Session(address, world), true); assert.equal(reads, 1); passed++;
  assert.equal(await restoreV2Session('0x4444444444444444444444444444444444444444', world), false); assert.equal(reads, 1); passed++;
  assert.equal(await restoreV2Session(address, { ...world, chainId: 4663 }), false); assert.equal(reads, 1); passed++;
  cacheV2Session(address, world, { token: makeToken() + 'x', expiresAt });
  assert.equal(await restoreV2Session(address, world), false); assert.equal(entries.size, 0); passed++;
  cacheV2Session(address, world, { token: makeToken(4663), expiresAt });
  assert.equal(await restoreV2Session(address, world), false); assert.equal(entries.size, 0); passed++;
  cacheV2Session(address, world, { token: makeToken(), expiresAt: expiresAt - 7200 });
  const before = reads; assert.equal(await restoreV2Session(address, world), false); assert.equal(reads, before); passed++;
  const otherWorld = { ...world, collection: address as `0x${string}` };
  cacheV2Session(address, otherWorld, { token: makeToken(), expiresAt });
  assert.equal(await restoreV2Session(address, otherWorld), false); assert.equal(entries.size, 0); passed++;
  cacheV2Session(address, world, { token: makeToken(), expiresAt });
  let release!: (response: Response) => void;
  globalThis.fetch = () => new Promise<Response>(resolve => { release = resolve; });
  const pending = restoreV2Session(address, world); setV2Session('');
  release(new Response(JSON.stringify({ address, ...world, expiresAt }))); assert.equal(await pending, false); passed++;
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await assert.rejects(restoreV2Session(address, world), error => error instanceof V2ApiError && error.code === 'connection'); assert.equal(entries.size, 1); passed++;
  // Browsers that disallow sessionStorage must still allow Verify -> Start in
  // the current visit. The fallback receives the same server MAC/expiry check.
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get() { throw new DOMException('Storage unavailable', 'SecurityError'); } });
  cacheV2Session(address, world, { token: makeToken(), expiresAt });
  globalThis.fetch = async (_input, init) => { reads++; return handleV2Api(new Request('http://127.0.0.1/api/v2/session', init)); };
  assert.equal(await restoreV2Session(address, world), true); passed++;
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
  console.log(JSON.stringify({ passed, scope: 'Session reuse, server MAC/expiry/chain validation, exact-world cache binding, stale async adoption and transient outage. Zero RPC, inference, wallet or financial-store operations.' }));
} finally {
  globalThis.fetch = originalFetch; setV2Session('');
  if (originalStorage) Object.defineProperty(globalThis, 'sessionStorage', originalStorage); else Reflect.deleteProperty(globalThis, 'sessionStorage');
  for (const [key, value] of [['NEARLYHUMAN_SESSION_SECRET', previous.secret], ['NEARLYHUMAN_V2_RUNTIME_JSON', previous.runtime]]) { if (value === undefined) delete process.env[key!]; else process.env[key!] = value; }
}
