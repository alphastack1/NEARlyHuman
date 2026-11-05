import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import original from '../contracts/deployments/robinhood-testnet-original.json';
import native from '../contracts/deployments/near-testnet.json';
import type { Address } from 'viem';
import type { EvmPublicLife } from '../src/chain/evm-types';
import type { NearPublicLife } from '../src/chain/game-types';
import { createState } from '../src/domain/state';
import { handleApi } from './http';
import { evmConfig } from './config';
import { evmNftMetadata } from './evm/views';
import { nearNftMetadata } from './near/views';
import { dispatchBackground, validWorkerSecret } from './worker';
import background from '../netlify/functions/prepare-background';

const fixtureSecret = 'runtime-tests-only-session-secret-32-characters';
const address = '0x0000000000000000000000000000000000000001';

async function environment(values: Record<string, string | undefined>, run: () => Promise<void>) {
  const previous = Object.fromEntries(Object.keys(values).map(key => [key, process.env[key]]));
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
  try { await run(); }
  finally { for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
}

test('canonical EVM configuration keeps deployed runtime and campaign settings compatible', async () => {
  await environment({ NEARLYHUMAN_EVM_RUNTIME_JSON: undefined, NEARLYHUMAN_V2_RUNTIME_JSON: 'existing-runtime', NEARLYHUMAN_EVM_CAMPAIGN: undefined, NEARLYHUMAN_V2_CAMPAIGN: 'existing-funded-campaign' }, async () => {
    assert.equal(evmConfig().runtimeJson, 'existing-runtime');
    assert.equal(evmConfig().campaign, 'existing-funded-campaign');
    process.env.NEARLYHUMAN_EVM_RUNTIME_JSON = 'canonical-runtime';
    process.env.NEARLYHUMAN_EVM_CAMPAIGN = 'same-funded-campaign';
    assert.equal(evmConfig().runtimeJson, 'canonical-runtime');
    assert.equal(evmConfig().campaign, 'same-funded-campaign');
  });
});

test('canonical and bookmarked EVM session routes accept the existing session MAC without RPC or storage', async () => {
  await environment({ NEARLYHUMAN_EVM_RUNTIME_JSON: JSON.stringify(original.runtime), NEARLYHUMAN_SESSION_SECRET: fixtureSecret, NEARLYHUMAN_EVM_CHAIN_ID: '46630' }, async () => {
    const fetch = globalThis.fetch;
    globalThis.fetch = async () => { throw new Error('Session route must not call a service.'); };
    try {
      const payload = Buffer.from(JSON.stringify({ address, chainId: 46630, expiresAt: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
      const token = payload + '.' + createHmac('sha256', fixtureSecret).update(payload).digest('base64url');
      const paths = ['/api/evm/session', '/api/v2/session', '/.netlify/functions/api/v2/session'];
      const results = [];
      for (const path of paths) {
        const response = await handleApi(new Request('https://app.example.test' + path, { headers: { authorization: 'Bearer ' + token } }));
        assert.equal(response.status, 200, path);
        results.push(await response.json());
      }
      assert.deepEqual(results[0], results[1]); assert.deepEqual(results[0], results[2]);
      assert.equal(results[0].collection, original.runtime.collection);
      assert.equal(results[0].address, address);
    } finally { globalThis.fetch = fetch; }
  });
});

test('HTTP compatibility preserves POST validation while retired endpoints stay unavailable', async () => {
  await environment({ NEARLYHUMAN_EVM_RUNTIME_JSON: JSON.stringify(original.runtime), NEARLYHUMAN_SESSION_SECRET: fixtureSecret }, async () => {
    for (const path of ['/api/evm/auth/challenge', '/api/auth/challenge', '/.netlify/functions/api/auth/challenge']) {
      const response = await handleApi(new Request('https://app.example.test' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' }));
      assert.equal(response.status, 400, path);
      assert.equal((await response.json()).error.code, 'format');
    }
    for (const path of ['/api/config', '/api/quote', '/api/roosters', '/api/nft/46630/1']) {
      assert.equal((await handleApi(new Request('https://app.example.test' + path))).status, 404, path);
    }
    for (const path of ['/api/worlds', '/api/game/worlds', '/.netlify/functions/api/game/worlds']) {
      assert.equal((await handleApi(new Request('https://app.example.test' + path, { method: 'POST' }))).status, 405, path);
    }
  });
});

test('native session bookmarks keep their existing scoped MAC without RPC or storage', async () => {
  await environment({ NEARLYHUMAN_NEAR_RUNTIME_JSON: JSON.stringify(native.runtime), NEARLYHUMAN_SESSION_SECRET: fixtureSecret }, async () => {
    const value = { address: 'fixture.testnet', networkId: 'near-testnet', collection: native.runtime.collection, expiresAt: Math.floor(Date.now() / 1000) + 3600 };
    const payload = Buffer.from(JSON.stringify(value)).toString('base64url');
    const token = payload + '.' + createHmac('sha256', fixtureSecret).update('nearlyhuman-native-near-session-v2\n' + payload).digest('base64url');
    for (const path of ['/api/near/session', '/api/near/v2/session', '/.netlify/functions/api/near/v2/session']) {
      const response = await handleApi(new Request('https://app.example.test' + path, { headers: { authorization: 'Bearer ' + token } }));
      assert.equal(response.status, 200, path);
      assert.deepEqual(await response.json(), value);
    }
  });
});

test('new metadata images use canonical APIs while public life identity paths stay stable', () => {
  const common = { version: 2 as const, id: '1', owner: address as Address, name: 'TEST', revision: 0, state: createState({ seed: 1 }), purseMicro: '0', purseNonce: '0', observedBlock: '1' };
  const evm: EvmPublicLife = { ...common, chainId: 46630, collection: original.runtime.collection as Address };
  const near: NearPublicLife = { ...common, owner: 'fixture.testnet', networkId: 'near-testnet', collection: native.runtime.collection };
  const evmMetadata = evmNftMetadata(evm, 'https://app.example.test'), nearMetadata = nearNftMetadata(near, 'https://app.example.test');
  assert.ok(evmMetadata.image.startsWith('https://app.example.test/api/evm/nft/1/image.svg?'));
  assert.equal(evmMetadata.external_url, 'https://app.example.test/life/robinhood-testnet/1');
  assert.ok(nearMetadata.image.startsWith('https://app.example.test/api/near/nft/1/image.svg?'));
  assert.equal(nearMetadata.external_url, 'https://app.example.test/life/near-testnet/1');
});

test('worker dispatch keeps the current version-2 queue body and rejects retired work', async () => {
  await environment({ NEARLYHUMAN_SESSION_SECRET: fixtureSecret, URL: 'https://worker.example.test' }, async () => {
    assert.equal(validWorkerSecret(fixtureSecret), true);
    assert.equal(validWorkerSecret('different-secret'), false);
    assert.equal(validWorkerSecret(null), false);
    const fetch = globalThis.fetch, sent: { url: string; headers: Headers; body: unknown }[] = [];
    globalThis.fetch = async (url, init) => { sent.push({ url: String(url), headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) }); return new Response(null, { status: 202 }); };
    try {
      const body = { version: 2, jobId: `v2/jobs/46630/${original.runtime.collection}/0x${'1'.repeat(64)}` };
      await dispatchBackground(body);
      assert.equal(sent[0].url, 'https://worker.example.test/.netlify/functions/prepare-background');
      assert.equal(sent[0].headers.get('x-nearlyhuman-worker'), fixtureSecret);
      assert.deepEqual(sent[0].body, body);
      const retired = await background(new Request('https://worker.example.test/.netlify/functions/prepare-background', { method: 'POST', headers: { 'content-type': 'application/json', 'x-nearlyhuman-worker': fixtureSecret }, body: JSON.stringify({ requestId: '0x' + '1'.repeat(64) }) }));
      assert.equal(retired.status, 400);
      assert.equal(sent.length, 1);
    } finally { globalThis.fetch = fetch; }
  });
});
