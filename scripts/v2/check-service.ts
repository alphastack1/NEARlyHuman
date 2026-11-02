import assert from 'node:assert/strict';
import { createHmac, randomBytes } from 'node:crypto';
import type { PublicClient } from 'viem';
import { handleApi } from '../../server/http';
import { findV2Acceptance } from '../../server/v2/service';
import type { V2RuntimeIdentity } from '../../server/v2/context';

// A small HTTP-boundary and timestamp-search experiment, no AI or transactions.
const previous = { secret: process.env.NEARLYHUMAN_SESSION_SECRET, runtime: process.env.NEARLYHUMAN_V2_RUNTIME_JSON };
process.env.NEARLYHUMAN_SESSION_SECRET = randomBytes(32).toString('hex');
delete process.env.NEARLYHUMAN_V2_RUNTIME_JSON;
let passed = 0;
const post = (body: string, headers: Record<string, string> = {}) => handleApi(new Request('http://127.0.0.1:5173/api/v2/quote', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body }));
try {
  assert.equal((await post('{}', { origin: 'https://unrelated.invalid' })).status, 403); passed++;
  assert.equal((await post('{}', { 'Content-Type': 'text/plain' })).status, 415); passed++;
  assert.equal((await post(' '.repeat(64_001))).status, 413); passed++;
  for (const value of ['{', 'null', '[]', '42']) { assert.equal((await post(value)).status, 400); passed++; }
  assert.equal((await post('{"player":"0x1111111111111111111111111111111111111111"}')).status, 401); passed++;
  assert.equal((await handleApi(new Request('http://127.0.0.1:5173/api/v2/job/0x' + '1'.repeat(64)))).status, 401); passed++;
  const payload = Buffer.from(JSON.stringify({ address: '0x1111111111111111111111111111111111111111', chainId: 46630, expiresAt: Math.floor(Date.now() / 1000) + 60 })).toString('base64url');
  const token = payload + '.' + createHmac('sha256', process.env.NEARLYHUMAN_SESSION_SECRET!).update(payload).digest('base64url');
  const unconfigured = await post('{}', { Authorization: 'Bearer ' + token });
  assert.equal(unconfigured.status, 503);
  assert(!(await unconfigured.text()).includes(process.env.NEARLYHUMAN_SESSION_SECRET!)); passed++;
  const id = ('0x' + '2'.repeat(64)) as `0x${string}`, tx = ('0x' + '3'.repeat(64)) as `0x${string}`;
  const runtime = { collection: '0x1111111111111111111111111111111111111111' } as V2RuntimeIdentity;
  const timestamps = [0n, 2n, 2n, 2n, 5n, 10n, 10n, 12n];
  for (const [timestamp, from, to] of [[0n, 0n, 0n], [2n, 1n, 3n], [5n, 4n, 4n], [10n, 5n, 6n], [12n, 7n, 7n]]) {
    let calls = 0;
    const client = { getBlock: async ({ blockNumber }: { blockNumber: bigint }) => { calls++; assert(blockNumber >= 0n && blockNumber < BigInt(timestamps.length)); return { timestamp: timestamps[Number(blockNumber)] }; }, getLogs: async (filter: { fromBlock: bigint; toBlock: bigint; args: { id: string } }) => { assert.equal(filter.fromBlock, from); assert.equal(filter.toBlock, to); assert.equal(filter.args.id, id); return [{ transactionHash: tx }]; } } as unknown as PublicClient;
    assert.equal(await findV2Acceptance(client, runtime, id, timestamp, 7n), tx); assert(calls <= 8); passed++;
  }
  for (const timestamp of [1n, 11n, 13n]) {
    const client = { getBlock: async ({ blockNumber }: { blockNumber: bigint }) => ({ timestamp: timestamps[Number(blockNumber)] }), getLogs: async () => { throw Error('Must not scan an absent timestamp'); } } as unknown as PublicClient;
    await assert.rejects(findV2Acceptance(client, runtime, id, timestamp, 7n)); passed++;
  }
  console.log(JSON.stringify({ passed, paidCalls: 0, transactions: 0, scope: 'HTTP security gates and exact-timestamp recovery search; not live end-to-end evidence' }));
} finally {
  for (const [key, value] of [['NEARLYHUMAN_SESSION_SECRET', previous.secret], ['NEARLYHUMAN_V2_RUNTIME_JSON', previous.runtime]]) { if (value === undefined) delete process.env[key!]; else process.env[key!] = value; }
}
